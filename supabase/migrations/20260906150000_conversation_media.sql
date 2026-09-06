begin;
create table public.conversation_media (
 id uuid primary key,user_id uuid not null references public.app_users(id),relationship_id uuid not null references public.coaching_relationships(id),
 session_id uuid references public.workout_sessions(id),exercise_id uuid,exercise_name text,
 mime_type text not null check(mime_type in ('image/jpeg','video/webm','video/mp4')),object_name text not null unique,
 content_hash text not null check(content_hash~'^[a-f0-9]{64}$'),state text not null default 'pending' check(state in('pending','ready','removed')),
 message_id uuid unique references public.messages(id),shared_at timestamptz,created_at timestamptz not null default now()
);
create index conversation_media_relationship on public.conversation_media(relationship_id,created_at);
create index conversation_media_owner on public.conversation_media(user_id,created_at);
alter table public.conversation_media enable row level security;
revoke all on public.conversation_media from public,anon,authenticated;
grant select on public.conversation_media to authenticated;
create policy conversation_media_read on public.conversation_media for select to authenticated using(user_id=gymaf_private.active_actor() or (shared_at is not null and state='ready' and gymaf_private.can_read_relationship(relationship_id)));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('gymaf-conversation-media','gymaf-conversation-media',false,4194304,array['image/jpeg','video/mp4','video/webm']);
create policy conversation_media_storage_insert on storage.objects for insert to authenticated with check(bucket_id='gymaf-conversation-media' and exists(select 1 from public.conversation_media m where m.object_name=name and m.user_id=gymaf_private.active_actor() and m.state='pending'));
create policy conversation_media_storage_read on storage.objects for select to authenticated using(bucket_id='gymaf-conversation-media' and exists(select 1 from public.conversation_media m where m.object_name=name and m.state<>'removed'));
create policy conversation_media_storage_delete on storage.objects for delete to authenticated using(bucket_id='gymaf-conversation-media' and exists(select 1 from public.conversation_media m where m.object_name=name and m.user_id=gymaf_private.active_actor()));
create function public.gymaf_attachment_query(p_relationship uuid default null,p_id uuid default null) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); result jsonb;
begin
 if actor is null then raise exception 'Invalid application session' using errcode='28000';end if;
 if p_id is not null then
  select to_jsonb(m) into result from public.conversation_media m where id=p_id;
  if result is null then raise exception 'Media unavailable' using errcode='42501';end if;return result;
 end if;
 if p_relationship is not null and not gymaf_private.can_read_relationship(p_relationship) then raise exception 'Conversation unavailable' using errcode='42501';end if;
 return coalesce((select jsonb_agg(q.item order by q.created_at desc) from (select created_at,(to_jsonb(m)-array['object_name','content_hash','user_id'])||jsonb_build_object('owned',m.user_id=actor) as item from public.conversation_media m where state='ready' and (p_relationship is null or relationship_id=p_relationship) order by created_at desc limit 500)q),'[]'::jsonb);
end $$;
revoke all on function public.gymaf_attachment_query(uuid,uuid) from public,anon;
grant execute on function public.gymaf_attachment_query(uuid,uuid) to authenticated;
create function public.gymaf_attachment_command(p_action text,p_command_id uuid,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); ident uuid; item public.conversation_media; previous gymaf_private.commands; fingerprint text; result jsonb; rel uuid; session public.workout_sessions; exercise jsonb; sid uuid; eid uuid; message_result jsonb;
begin
 if actor is null then raise exception 'Invalid application session' using errcode='28000';end if;
 if p_action is null or p_action not in ('attachment.reserve','attachment.complete','attachment.remove','attachment.share') or p_command_id is null or jsonb_typeof(p) is distinct from 'object' or jsonb_typeof(p->'id') is distinct from 'string' then raise exception 'Invalid attachment command' using errcode='22023';end if;
 ident:=(p->>'id')::uuid;
 if (p_action='attachment.reserve' and (not(p ?& array['id','relationshipId','sessionId','exerciseId','mimeType','contentHash']) or (p-array['id','relationshipId','sessionId','exerciseId','mimeType','contentHash'])<>'{}'::jsonb)) or (p_action<>'attachment.reserve' and (p-'id')<>'{}'::jsonb) then raise exception 'Unexpected attachment fields' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,771));
 select * into item from public.conversation_media where id=ident for update;
 if item.id is not null and item.user_id<>actor then raise exception 'Attachment unavailable' using errcode='42501';end if;
 if p_action='attachment.reserve' then
  rel:=(p->>'relationshipId')::uuid;
  if rel is null or not gymaf_private.can_read_relationship(rel) or not gymaf_private.can_train(rel) then raise exception 'Active conversation required' using errcode='42501';end if;
 elsif item.id is null then raise exception 'Attachment unavailable' using errcode='42501';end if;
 fingerprint:=encode(extensions.digest(p_action||p::text,'sha256'),'hex');
 select * into previous from gymaf_private.commands where actor_id=actor and command_id=p_command_id;
 if found then if previous.action<>p_action or previous.request_hash<>fingerprint then raise exception 'Idempotency conflict' using errcode='GY409';end if;return previous.result;end if;
 if p_action='attachment.reserve' then
  if item.id is not null then raise exception 'Attachment already reserved' using errcode='GY409';end if;
  if jsonb_typeof(p->'mimeType') is distinct from 'string' or p->>'mimeType' not in ('image/jpeg','video/webm','video/mp4') or jsonb_typeof(p->'contentHash') is distinct from 'string' or p->>'contentHash' !~ '^[a-f0-9]{64}$' then raise exception 'Invalid media format' using errcode='22023';end if;
  sid:=(p->>'sessionId')::uuid;eid:=(p->>'exerciseId')::uuid;
  if sid is not null then
   select * into session from public.workout_sessions where id=sid and relationship_id=rel;
   if session.id is null or not exists(select 1 from public.coaching_relationships where id=rel and client_user_id=actor) then raise exception 'Session unavailable' using errcode='42501';end if;
   select e into exercise from jsonb_array_elements(session.prescription->'exercises')e where e->>'id'=eid::text;
   if exercise is null then raise exception 'Exercise unavailable' using errcode='42501';end if;
  elsif eid is not null then raise exception 'Exercise requires a session' using errcode='22023';end if;
  if (select count(*) from public.conversation_media where user_id=actor and state<>'removed')>=300 then raise exception 'Media limit reached. Remove an earlier upload.' using errcode='22023';end if;
  insert into public.conversation_media(id,user_id,relationship_id,session_id,exercise_id,exercise_name,mime_type,object_name,content_hash)values(ident,actor,rel,sid,eid,exercise->>'name',p->>'mimeType',actor::text||'/'||ident::text||case p->>'mimeType' when 'image/jpeg' then '.jpg' when 'video/mp4' then '.mp4' else '.webm' end,p->>'contentHash');
 elsif p_action='attachment.complete' then
  if item.state='removed' then raise exception 'Attachment removed' using errcode='GY409';end if;
  if not exists(select 1 from storage.objects where bucket_id='gymaf-conversation-media' and name=item.object_name) then raise exception 'Upload missing' using errcode='22023';end if;
  update public.conversation_media set state='ready' where id=ident;
 elsif p_action='attachment.share' then
  if item.state<>'ready' or not gymaf_private.can_read_relationship(item.relationship_id) or not gymaf_private.can_train(item.relationship_id) then raise exception 'Active conversation and ready media required' using errcode='42501';end if;
  if item.shared_at is null then
   message_result:=public.gymaf_command('message.send',md5(p_command_id::text||':attachment-message')::uuid,jsonb_build_object('relationshipId',item.relationship_id,'body',case when item.mime_type='image/jpeg' then 'Shared a photo.' else 'Shared a video.' end||case when item.exercise_name is not null then ' '||item.exercise_name else '' end));
   update public.conversation_media set shared_at=now(),message_id=(message_result->>'id')::uuid where id=ident;
  end if;
 else
  if exists(select 1 from storage.objects where bucket_id='gymaf-conversation-media' and name=item.object_name) then raise exception 'Remove stored media first' using errcode='22023';end if;
  update public.conversation_media set state='removed' where id=ident;
 end if;
 result:=jsonb_build_object('id',ident);
 insert into gymaf_private.commands(actor_id,command_id,action,request_hash,result)values(actor,p_command_id,p_action,fingerprint,result);
 insert into gymaf_private.audit_events(actor_id,action,resource_id,command_id)values(actor,p_action,ident,p_command_id);
 return result;
end $$;
revoke all on function public.gymaf_attachment_command(text,uuid,jsonb) from public,anon;
grant execute on function public.gymaf_attachment_command(text,uuid,jsonb) to authenticated;
commit;
