begin;
alter table public.member_media add column selected_at timestamptz;
alter table public.member_media add constraint member_media_selection_check check(selected_at is null or (kind in ('avatar','cover') and state='ready'));
-- Preserve an existing active profile image when adopting explicit selection.
with latest as(select distinct on(user_id,kind) id from public.member_media where state='ready' and kind in ('avatar','cover') order by user_id,kind,created_at desc,id desc)
update public.member_media m set selected_at=now() from latest where m.id=latest.id;
create unique index member_media_selected_idx on public.member_media(user_id,kind) where selected_at is not null;
create or replace function public.gymaf_media_command(p_action text,p_command_id uuid,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); ident uuid; item public.member_media; previous gymaf_private.commands; fingerprint text; result jsonb;
begin
  if actor is null then raise exception 'Invalid application session' using errcode='28000'; end if;
  if p_action is null or p_action not in ('media.reserve','media.complete','media.remove','media.select') or p_command_id is null or jsonb_typeof(p) is distinct from 'object'
    or jsonb_typeof(p->'id') is distinct from 'string' then raise exception 'Invalid media command' using errcode='22023'; end if;
  ident:=(p->>'id')::uuid;
  if (p_action='media.reserve' and (p-array['id','kind','view','date','contentHash'])<>'{}'::jsonb) or (p_action<>'media.reserve' and (p-array['id'])<>'{}'::jsonb)
    then raise exception 'Unexpected media fields' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,771));
  select * into item from public.member_media where id=ident for update;
  if item.user_id is not null and item.user_id<>actor then raise exception 'Photo unavailable' using errcode='42501'; end if;
  fingerprint:=encode(extensions.digest(p_action||p::text,'sha256'),'hex');
  select * into previous from gymaf_private.commands where actor_id=actor and command_id=p_command_id;
  if found then
    if previous.action<>p_action or previous.request_hash<>fingerprint then raise exception 'Idempotency conflict' using errcode='GY409'; end if;
    return previous.result;
  end if;
  if p_action='media.reserve' then
    if item.id is not null then raise exception 'Photo already reserved' using errcode='GY409'; end if;
    if jsonb_typeof(p->'kind') is distinct from 'string' or p->>'kind' not in ('avatar','cover','progress')
      or jsonb_typeof(p->'view') is distinct from 'string' or p->>'view' not in ('front','back','side','image')
      or jsonb_typeof(p->'date') is distinct from 'string' or p->>'date' !~ '^\d{4}-\d{2}-\d{2}$'
      or jsonb_typeof(p->'contentHash') is distinct from 'string' or p->>'contentHash' !~ '^[0-9a-f]{64}$'
      then raise exception 'Invalid photo details' using errcode='22023'; end if;
    if (select count(*) from public.member_media where user_id=actor and state='ready')>=300
      or (select count(*) from public.member_media where user_id=actor and state='pending' and created_at>now()-interval '1 day')>=30
      then raise exception 'Photo limit reached' using errcode='22023'; end if;
    insert into public.member_media(id,user_id,kind,view,taken_on,object_name,content_hash)
      values(ident,actor,p->>'kind',p->>'view',(p->>'date')::date,actor::text||'/'||ident::text||'.jpg',p->>'contentHash');
  elsif item.id is null then raise exception 'Photo unavailable' using errcode='42501';
  elsif p_action='media.complete' then
    if item.state='removed' then raise exception 'Photo was removed' using errcode='GY409'; end if;
    if not exists(select 1 from storage.objects where bucket_id='gymaf-member-media' and name=item.object_name)
      then raise exception 'Upload not found' using errcode='22023'; end if;
    update public.member_media set state='ready' where id=ident;
  elsif p_action='media.select' then
    if item.state<>'ready' or item.kind='progress' then raise exception 'Choose a saved profile photo' using errcode='22023'; end if;
    update public.member_media set selected_at=null where user_id=actor and kind=item.kind and selected_at is not null;
    update public.member_media set selected_at=clock_timestamp() where id=ident;
  else
    if exists(select 1 from storage.objects where bucket_id='gymaf-member-media' and name=item.object_name)
      then raise exception 'Remove the stored file first' using errcode='22023'; end if;
    update public.member_media set state='removed',selected_at=null where id=ident;
  end if;
  result:=jsonb_build_object('id',ident);
  insert into gymaf_private.commands(actor_id,command_id,action,request_hash,result) values(actor,p_command_id,p_action,fingerprint,result);
  insert into gymaf_private.audit_events(actor_id,action,resource_id,command_id) values(actor,p_action,ident,p_command_id);
  return result;
end $$;
commit;
