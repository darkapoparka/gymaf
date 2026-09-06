begin;
create table public.member_media (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  kind text not null check(kind in ('avatar','cover','progress')),
  view text not null check(view in ('front','back','side','image')),
  taken_on date not null,
  object_name text unique not null,
  content_hash text not null check(content_hash ~ '^[0-9a-f]{64}$'),
  state text not null default 'pending' check(state in ('pending','ready','removed')),
  created_at timestamptz not null default now(),
  check((kind='progress' and view in ('front','back','side')) or (kind in ('avatar','cover') and view='image'))
);
create index member_media_owner_idx on public.member_media(user_id,state,taken_on desc,created_at desc);
alter table public.member_media enable row level security;
create policy member_media_read on public.member_media for select to authenticated using(user_id=gymaf_private.active_actor());
revoke all on public.member_media from anon,authenticated;
grant select on public.member_media to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('gymaf-member-media','gymaf-member-media',false,4194304,array['image/jpeg']);
-- Immutable object names. No UPDATE/upsert policy: replacement means a new asset.
create policy gymaf_media_insert on storage.objects for insert to authenticated with check (
  bucket_id='gymaf-member-media' and exists(select 1 from public.member_media m where m.object_name=name and m.user_id=gymaf_private.active_actor() and m.state='pending')
);
create policy gymaf_media_read on storage.objects for select to authenticated using (
  bucket_id='gymaf-member-media' and exists(select 1 from public.member_media m where m.object_name=name and m.user_id=gymaf_private.active_actor() and m.state<>'removed')
);
create policy gymaf_media_delete on storage.objects for delete to authenticated using (
  bucket_id='gymaf-member-media' and exists(select 1 from public.member_media m where m.object_name=name and m.user_id=gymaf_private.active_actor())
);
create function public.gymaf_media_query(p_id uuid default null) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); result jsonb;
begin
  if actor is null then raise exception 'Invalid application session' using errcode='28000'; end if;
  if p_id is not null then
    select to_jsonb(m) into result from public.member_media m where id=p_id;
    if result is null then raise exception 'Photo unavailable' using errcode='42501'; end if;
    return result;
  end if;
  return coalesce((select jsonb_agg(to_jsonb(m) order by taken_on desc,created_at desc,id) from public.member_media m where state='ready'),'[]'::jsonb);
end $$;
revoke all on function public.gymaf_media_query(uuid) from public,anon;
grant execute on function public.gymaf_media_query(uuid) to authenticated;

create function public.gymaf_media_command(p_action text,p_command_id uuid,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); ident uuid; item public.member_media; previous gymaf_private.commands; fingerprint text; result jsonb;
begin
  if actor is null then raise exception 'Invalid application session' using errcode='28000'; end if;
  if p_action is null or p_action not in ('media.reserve','media.complete','media.remove') or p_command_id is null or jsonb_typeof(p) is distinct from 'object'
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
  else
    if exists(select 1 from storage.objects where bucket_id='gymaf-member-media' and name=item.object_name)
      then raise exception 'Remove the stored file first' using errcode='22023'; end if;
    update public.member_media set state='removed' where id=ident;
  end if;
  result:=jsonb_build_object('id',ident);
  insert into gymaf_private.commands(actor_id,command_id,action,request_hash,result) values(actor,p_command_id,p_action,fingerprint,result);
  insert into gymaf_private.audit_events(actor_id,action,resource_id,command_id) values(actor,p_action,ident,p_command_id);
  return result;
end $$;
revoke all on function public.gymaf_media_command(text,uuid,jsonb) from public,anon;
grant execute on function public.gymaf_media_command(text,uuid,jsonb) to authenticated;
commit;
