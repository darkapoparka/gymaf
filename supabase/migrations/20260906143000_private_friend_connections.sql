begin;
create table public.friend_connections (
 id uuid primary key default gen_random_uuid(), first_user uuid not null references public.app_users(id) on delete cascade,
 second_user uuid not null references public.app_users(id) on delete cascade, created_at timestamptz not null default now(),
 check(first_user<second_user),unique(first_user,second_user)
);
create table gymaf_private.friend_invitations (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.app_users(id) on delete cascade,
 token_hash text not null unique, expires_at timestamptz not null default now()+interval '7 days', accepted_by uuid references public.app_users(id), accepted_at timestamptz
);
alter table public.friend_connections enable row level security;
alter table gymaf_private.friend_invitations enable row level security;
revoke all on public.friend_connections,gymaf_private.friend_invitations from public,anon,authenticated;
grant select on public.friend_connections to authenticated;
create policy friends_participant_read on public.friend_connections for select to authenticated using(gymaf_private.active_actor() in(first_user,second_user));
create function public.gymaf_social_query(p_token text default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); zone text; since timestamptz; invited gymaf_private.friend_invitations; friend_list jsonb;
begin
 if actor is null then raise exception 'Invalid application session' using errcode='28000';end if;
 if p_token is not null then
  if p_token !~ '^[a-f0-9]{64}$' then raise exception 'Invitation unavailable' using errcode='42501';end if;
  select * into invited from gymaf_private.friend_invitations where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and expires_at>now() and accepted_by is null;
  if invited.id is null or not exists(select 1 from public.app_users where id=invited.owner_id and status='active') then raise exception 'Invitation unavailable or already used' using errcode='42501';end if;
  return jsonb_build_object('inviterName',(select display_name from public.app_users where id=invited.owner_id),'ownInvitation',actor=invited.owner_id,'expiresAt',invited.expires_at);
 end if;
 select timezone into zone from public.app_users where id=actor;
 since:=date_trunc('week',now() at time zone zone) at time zone zone;
 select coalesce(jsonb_agg(q.item order by q.total desc,q.name,q.ident),'[]'::jsonb) into friend_list from (
  select u.display_name as name,u.id as ident,count(s.id) as total,jsonb_build_object('id',u.id,'name',u.display_name,'self',u.id=actor,'workouts',count(s.id)) as item
  from public.app_users u left join public.coaching_relationships r on r.client_user_id=u.id
  left join public.workout_sessions s on s.relationship_id=r.id and s.state='completed' and s.completed_at>=since and s.completed_at<((date_trunc('week',now() at time zone zone)+interval '7 days') at time zone zone)
  where u.status='active' and (u.id=actor or exists(select 1 from public.friend_connections f where (f.first_user=actor and f.second_user=u.id) or (f.second_user=actor and f.first_user=u.id))) group by u.id,u.display_name
 ) q;
 return jsonb_build_object('friends',friend_list,'weekStartsAt',since,'timezone',zone,'invitations',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'expiresAt',expires_at) order by expires_at),'[]'::jsonb) from gymaf_private.friend_invitations where owner_id=actor and accepted_by is null and expires_at>now()));
end $$;
revoke all on function public.gymaf_social_query(text) from public,anon;
grant execute on function public.gymaf_social_query(text) to authenticated;
create function public.gymaf_social_command(p_action text,p_command_id uuid,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); token text; peer uuid; ident uuid; invitation gymaf_private.friend_invitations; previous gymaf_private.commands; fingerprint text; result jsonb;
begin
 if actor is null then raise exception 'Invalid application session' using errcode='28000';end if;
 if p_command_id is null or jsonb_typeof(p) is distinct from 'object' then raise exception 'Invalid friend command' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,771));
 if p_action in ('social.invite','social.accept','social.revoke') then
  if not(p ? 'token') or (p-'token')<>'{}'::jsonb or jsonb_typeof(p->'token') is distinct from 'string' or p->>'token' !~ '^[a-f0-9]{64}$' then raise exception 'Invalid invitation' using errcode='22023';end if;
  token:=p->>'token';
  if p_action='social.revoke' then
   select * into invitation from gymaf_private.friend_invitations where owner_id=actor and token_hash=encode(extensions.digest(token,'sha256'),'hex') for update;
   if invitation.id is null then raise exception 'Invitation unavailable' using errcode='42501';end if;
  end if;
  if p_action='social.accept' then
   select * into invitation from gymaf_private.friend_invitations where token_hash=encode(extensions.digest(token,'sha256'),'hex') for update;
   if invitation.id is null or invitation.owner_id=actor or (invitation.accepted_by is not null and invitation.accepted_by<>actor) or not exists(select 1 from public.app_users where id=invitation.owner_id and status='active') then raise exception 'Invitation unavailable' using errcode='42501';end if;
   peer:=invitation.owner_id;
  end if;
 elsif p_action='social.revoke-id' then
  if not(p ? 'id') or (p-'id')<>'{}'::jsonb then raise exception 'Invalid friend command' using errcode='22023';end if;
  select * into invitation from gymaf_private.friend_invitations where id=(p->>'id')::uuid and owner_id=actor for update;
  if invitation.id is null then raise exception 'Invitation unavailable' using errcode='42501';end if;
 elsif p_action='social.remove' then
  if not(p ? 'id') or (p-'id')<>'{}'::jsonb then raise exception 'Invalid friend command' using errcode='22023';end if;
  peer:=(p->>'id')::uuid;if peer is null or peer=actor then raise exception 'Invalid friend' using errcode='22023';end if;
 else raise exception 'Unknown friend command' using errcode='22023';end if;
 fingerprint:=encode(extensions.digest(p_action||p::text,'sha256'),'hex');
 select * into previous from gymaf_private.commands where actor_id=actor and command_id=p_command_id;
 if found then if previous.action<>p_action or previous.request_hash<>fingerprint then raise exception 'Idempotency conflict' using errcode='GY409';end if;return previous.result;end if;
 if p_action='social.invite' then
  if (select count(*) from gymaf_private.friend_invitations where owner_id=actor and expires_at>now() and accepted_by is null)>=10 then raise exception 'You already have ten active invitations. Share an existing link or wait for it to expire.' using errcode='22023';end if;
  insert into gymaf_private.friend_invitations(owner_id,token_hash)values(actor,encode(extensions.digest(token,'sha256'),'hex'))returning id into ident;
 elsif p_action='social.accept' then
  if invitation.expires_at<=now() or invitation.accepted_by is not null then raise exception 'Invitation expired or already used' using errcode='42501';end if;
  insert into public.friend_connections(first_user,second_user)values(least(actor,peer),greatest(actor,peer))on conflict(first_user,second_user)do update set first_user=excluded.first_user returning id into ident;
  update gymaf_private.friend_invitations set accepted_by=actor,accepted_at=now() where id=invitation.id;
 elsif p_action in('social.revoke','social.revoke-id') then
  update gymaf_private.friend_invitations set expires_at=least(expires_at,now()) where id=invitation.id;
  ident:=invitation.id;
 else
  delete from public.friend_connections where first_user=least(actor,peer) and second_user=greatest(actor,peer) returning id into ident;
  ident:=coalesce(ident,peer);
 end if;
 result:=jsonb_build_object('id',ident);
 insert into gymaf_private.commands(actor_id,command_id,action,request_hash,result)values(actor,p_command_id,p_action,fingerprint,result);
 insert into gymaf_private.audit_events(actor_id,action,resource_id,command_id)values(actor,p_action,ident,p_command_id);
 return result;
end $$;
revoke all on function public.gymaf_social_command(text,uuid,jsonb) from public,anon;
grant execute on function public.gymaf_social_command(text,uuid,jsonb) to authenticated;
commit;
