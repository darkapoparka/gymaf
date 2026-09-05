-- Gymaf connected-web schema. Apply to an isolated Supabase project first.
-- No real client data, service-role browser client, or public table mutations.
begin;
create schema if not exists gymaf_private;
revoke all on schema gymaf_private from public, anon;
grant usage on schema gymaf_private to authenticated, service_role;
create extension if not exists pgcrypto with schema extensions;

create table public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (length(display_name) <= 120),
  locale text not null default 'bg' check (locale in ('bg','en')),
  timezone text not null default 'Europe/Sofia',
  goal text not null default '' check (length(goal) <= 500),
  equipment text not null default '' check (length(equipment) <= 1000),
  availability text not null default '' check (length(availability) <= 1000),
  revision integer not null default 0 check (revision >= 0),
  status text not null default 'active' check (status in ('active','suspended','deleted')),
  created_at timestamptz not null default now()
);
create table gymaf_private.application_sessions (
  provider_session_id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  created_at timestamptz not null default now(), revoked_at timestamptz
);
create index application_sessions_user_idx on gymaf_private.application_sessions(user_id);
create table gymaf_private.runtime (singleton boolean primary key default true check(singleton), synthetic_local boolean not null default false);
insert into gymaf_private.runtime(singleton) values(true);
create table gymaf_private.operators (user_id uuid primary key references public.app_users(id) on delete cascade);
create table gymaf_private.commands (
  actor_id uuid not null references public.app_users(id) on delete cascade,
  command_id uuid not null, action text not null, request_hash text not null,
  result jsonb not null, created_at timestamptz not null default now(),
  primary key(actor_id,command_id)
);
create table gymaf_private.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid, action text not null, resource_id uuid, command_id uuid,
  reason text not null default '', created_at timestamptz not null default now()
);
create table public.workspaces (
  id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 120),
  slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 80),
  public_name text not null default '' check(length(public_name) <= 120), bio text not null default '' check(length(bio) <= 2000),
  published boolean not null default false, status text not null default 'active' check(status in ('active','suspended')),
  created_at timestamptz not null default now()
);
create table public.workspace_memberships (
  workspace_id uuid not null references public.workspaces(id), user_id uuid not null references public.app_users(id),
  role text not null check(role in ('owner','coach')), status text not null default 'active' check(status in ('active','revoked')),
  primary key(workspace_id,user_id)
);
create table public.coaching_relationships (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  client_user_id uuid not null references public.app_users(id), coach_user_id uuid not null,
  state text not null default 'active' check(state in ('active','paused','ended')),
  created_at timestamptz not null default now(), ended_at timestamptz,
  unique(workspace_id,id),
  foreign key(workspace_id,coach_user_id) references public.workspace_memberships(workspace_id,user_id),
  check(client_user_id <> coach_user_id)
);
create unique index one_primary_relationship on public.coaching_relationships(client_user_id) where state in ('active','paused');
create index relationship_coach_idx on public.coaching_relationships(coach_user_id,workspace_id,state);
create table gymaf_private.invitations (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  coach_user_id uuid not null, recipient_email text not null, token_hash text unique not null,
  expires_at timestamptz not null default now()+interval '7 days', accepted_by uuid references public.app_users(id),
  relationship_id uuid references public.coaching_relationships(id), accepted_at timestamptz, revoked_at timestamptz,
  foreign key(workspace_id,coach_user_id) references public.workspace_memberships(workspace_id,user_id)
);
create table public.programs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  title text not null check(length(title) between 1 and 120), draft jsonb not null,
  revision integer not null default 0 check(revision >= 0), created_at timestamptz not null default now(),
  unique(workspace_id,id)
);
create table public.program_versions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, program_id uuid not null,
  title text not null, version integer not null check(version > 0), plan jsonb not null,
  created_at timestamptz not null default now(), unique(program_id,version), unique(workspace_id,id),
  foreign key(workspace_id,program_id) references public.programs(workspace_id,id)
);
create table public.scheduled_workouts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, relationship_id uuid not null,
  assignment_id uuid not null, version_id uuid not null, workout_id uuid not null, prescription jsonb not null,
  scheduled_date date not null, timezone text not null,
  state text not null default 'assigned' check(state in ('assigned','completed','canceled')),
  revision integer not null default 0 check(revision >= 0), created_at timestamptz not null default now(),
  unique(assignment_id,workout_id), unique(workspace_id,relationship_id,id),
  foreign key(workspace_id,relationship_id) references public.coaching_relationships(workspace_id,id),
  foreign key(workspace_id,version_id) references public.program_versions(workspace_id,id)
);
create index schedule_relationship_date_idx on public.scheduled_workouts(relationship_id,scheduled_date,id);
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, relationship_id uuid not null, scheduled_workout_id uuid not null,
  prescription jsonb not null, state text not null default 'in_progress' check(state in ('in_progress','paused','completed','abandoned')),
  revision integer not null default 0 check(revision >= 0), started_at timestamptz not null default now(),
  running_since timestamptz default now(), elapsed_seconds integer not null default 0 check(elapsed_seconds >= 0), completed_at timestamptz,
  unique(workspace_id,relationship_id,id),
  foreign key(workspace_id,relationship_id,scheduled_workout_id) references public.scheduled_workouts(workspace_id,relationship_id,id),
  check((state='in_progress') = (running_since is not null)),
  check((state in ('completed','abandoned')) = (completed_at is not null))
);
create unique index one_open_attempt on public.workout_sessions(scheduled_workout_id) where state in ('in_progress','paused');
create index session_relationship_idx on public.workout_sessions(relationship_id,started_at desc,id);
create table public.set_logs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, relationship_id uuid not null, session_id uuid not null,
  exercise_id uuid not null, set_index integer not null check(set_index between 0 and 19),
  actual_reps integer check(actual_reps between 0 and 1000), load_kg numeric(8,3) check(load_kg between 0 and 1000),
  duration_seconds numeric(10,3) check(duration_seconds between 0 and 86400), distance_m numeric(12,3) check(distance_m between 0 and 1000000),
  skipped boolean not null default false, revision integer not null default 1 check(revision > 0),
  updated_at timestamptz not null default now(), unique(session_id,exercise_id,set_index),
  foreign key(workspace_id,relationship_id,session_id) references public.workout_sessions(workspace_id,relationship_id,id),
  check(not skipped or (actual_reps is null and load_kg is null and duration_seconds is null and distance_m is null))
);
create table public.check_ins (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, relationship_id uuid not null,
  week_start date not null check(extract(isodow from week_start)=1), difficulty integer not null check(difficulty between 1 and 10),
  body text not null default '' check(length(body)<=2000), created_at timestamptz not null default now(),
  unique(relationship_id,week_start), unique(workspace_id,relationship_id,id),
  foreign key(workspace_id,relationship_id) references public.coaching_relationships(workspace_id,id)
);
create table public.coach_reviews (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, relationship_id uuid not null, check_in_id uuid unique not null,
  author_id uuid not null references public.app_users(id), body text not null check(length(body) between 1 and 4000), created_at timestamptz not null default now(),
  foreign key(workspace_id,relationship_id,check_in_id) references public.check_ins(workspace_id,relationship_id,id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, relationship_id uuid not null,
  sender_id uuid not null references public.app_users(id), body text not null check(length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default clock_timestamp(), unique(workspace_id,relationship_id,id),
  foreign key(workspace_id,relationship_id) references public.coaching_relationships(workspace_id,id)
);
create index message_cursor_idx on public.messages(relationship_id,created_at desc,id desc);
create table public.conversation_reads (
  relationship_id uuid not null references public.coaching_relationships(id), user_id uuid not null references public.app_users(id),
  last_read_at timestamptz not null, primary key(relationship_id,user_id)
);
create table public.service_entitlements (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, relationship_id uuid not null,
  source text not null check(source in ('complimentary','manual')), starts_at timestamptz not null, ends_at timestamptz not null,
  state text not null default 'active' check(state in ('active','canceled','revoked')), cancellation_requested_at timestamptz,
  created_at timestamptz not null default now(), check(ends_at > starts_at),
  foreign key(workspace_id,relationship_id) references public.coaching_relationships(workspace_id,id)
);
create index entitlement_lookup_idx on public.service_entitlements(relationship_id,state,ends_at);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id), event_id uuid not null,
  kind text not null, path text not null, created_at timestamptz not null default now(), read_at timestamptz,
  unique(user_id,event_id)
);
create index notification_user_idx on public.notifications(user_id,created_at desc);
create table public.data_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id),
  kind text not null check(kind in ('support','export','deletion')), body text not null default '' check(length(body)<=2000),
  state text not null default 'requested' check(state in ('requested','acknowledged','closed')),
  resolution text not null default '' check(length(resolution)<=2000), created_at timestamptz not null default now()
);
create unique index one_open_deletion_request on public.data_requests(user_id) where kind='deletion' and state <> 'closed';

create function gymaf_private.active_actor() returns uuid language sql stable security definer set search_path='' as $$
  select u.id from public.app_users u
  join gymaf_private.application_sessions s on s.user_id=u.id
  where u.id=auth.uid() and u.status='active' and s.provider_session_id::text=auth.jwt()->>'session_id' and s.revoked_at is null
$$;
create function gymaf_private.has_mfa() returns boolean language sql stable security definer set search_path='' as $$
  select coalesce(auth.jwt()->>'aal'='aal2',false) or (select synthetic_local from gymaf_private.runtime where singleton)
$$;
create function gymaf_private.is_operator() returns boolean language sql stable security definer set search_path='' as $$
  select gymaf_private.has_mfa() and exists(select 1 from gymaf_private.operators where user_id=gymaf_private.active_actor())
$$;
create function gymaf_private.is_staff(w uuid) returns boolean language sql stable security definer set search_path='' as $$
  select gymaf_private.has_mfa() and exists(select 1 from public.workspace_memberships m join public.workspaces s on s.id=m.workspace_id
  where m.workspace_id=w and m.user_id=gymaf_private.active_actor() and m.status='active' and s.status='active')
$$;
create function gymaf_private.is_owner(w uuid) returns boolean language sql stable security definer set search_path='' as $$
  select gymaf_private.is_staff(w) and exists(select 1 from public.workspace_memberships where workspace_id=w and user_id=gymaf_private.active_actor() and role='owner' and status='active')
$$;
create function gymaf_private.can_read_relationship(rid uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.coaching_relationships r where r.id=rid and
    (r.client_user_id=gymaf_private.active_actor() or (r.coach_user_id=gymaf_private.active_actor() and r.state in ('active','paused') and gymaf_private.is_staff(r.workspace_id))))
$$;
create function gymaf_private.is_coach(rid uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.coaching_relationships where id=rid and coach_user_id=gymaf_private.active_actor() and state='active' and gymaf_private.is_staff(workspace_id))
$$;
create function gymaf_private.can_train(rid uuid) returns boolean language sql stable security definer set search_path='' as $$
  select gymaf_private.can_read_relationship(rid) and exists(select 1 from public.coaching_relationships r join public.workspaces w on w.id=r.workspace_id
    join public.service_entitlements e on e.relationship_id=r.id where r.id=rid and r.state='active' and w.status='active'
    and e.state in ('active','canceled') and e.starts_at<=now() and e.ends_at>now())
$$;
create function gymaf_private.can_read_profile(uid uuid) returns boolean language sql stable security definer set search_path='' as $$
  select uid=gymaf_private.active_actor() or exists(select 1 from public.coaching_relationships r where r.client_user_id=uid and r.coach_user_id=gymaf_private.active_actor() and gymaf_private.can_read_relationship(r.id))
$$;
create function gymaf_private.relationship_json(rid uuid) returns jsonb language sql stable security definer set search_path='' as $$
  select to_jsonb(r)||jsonb_build_object('client_name',c.display_name,'coach_name',s.display_name)
    from public.coaching_relationships r join public.app_users c on c.id=r.client_user_id join public.app_users s on s.id=r.coach_user_id
    where r.id=rid and gymaf_private.can_read_relationship(r.id)
$$;

-- Read policies protect direct REST reads as well as invoker RPCs. All ordinary writes use bounded commands below.
alter table public.app_users enable row level security;
create policy user_read on public.app_users for select to authenticated using(gymaf_private.can_read_profile(id));
alter table public.workspaces enable row level security;
create policy workspace_read on public.workspaces for select to authenticated using(
  exists(select 1 from public.workspace_memberships m where m.workspace_id=id and m.user_id=gymaf_private.active_actor() and m.status='active')
  or exists(select 1 from public.coaching_relationships r where r.workspace_id=id and r.client_user_id=gymaf_private.active_actor())
);
alter table public.workspace_memberships enable row level security;
create policy membership_read on public.workspace_memberships for select to authenticated using(user_id=gymaf_private.active_actor() or gymaf_private.is_owner(workspace_id));
alter table public.coaching_relationships enable row level security;
create policy relationship_read on public.coaching_relationships for select to authenticated using(gymaf_private.can_read_relationship(id));
alter table public.programs enable row level security;
create policy program_read on public.programs for select to authenticated using(gymaf_private.is_staff(workspace_id));
alter table public.program_versions enable row level security;
create policy version_read on public.program_versions for select to authenticated using(gymaf_private.is_staff(workspace_id) or exists(select 1 from public.scheduled_workouts s where s.version_id=id and gymaf_private.can_read_relationship(s.relationship_id)));
alter table public.scheduled_workouts enable row level security;
create policy schedule_read on public.scheduled_workouts for select to authenticated using(gymaf_private.can_read_relationship(relationship_id));
alter table public.workout_sessions enable row level security;
create policy session_read on public.workout_sessions for select to authenticated using(gymaf_private.can_read_relationship(relationship_id));
alter table public.set_logs enable row level security;
create policy set_read on public.set_logs for select to authenticated using(gymaf_private.can_read_relationship(relationship_id));
alter table public.check_ins enable row level security;
create policy checkin_read on public.check_ins for select to authenticated using(gymaf_private.can_read_relationship(relationship_id));
alter table public.coach_reviews enable row level security;
create policy review_read on public.coach_reviews for select to authenticated using(gymaf_private.can_read_relationship(relationship_id));
alter table public.messages enable row level security;
create policy message_read on public.messages for select to authenticated using(gymaf_private.can_read_relationship(relationship_id));
alter table public.conversation_reads enable row level security;
create policy read_cursor_read on public.conversation_reads for select to authenticated using(gymaf_private.can_read_relationship(relationship_id));
alter table public.service_entitlements enable row level security;
create policy entitlement_read on public.service_entitlements for select to authenticated using(gymaf_private.can_read_relationship(relationship_id));
alter table public.notifications enable row level security;
create policy notification_read on public.notifications for select to authenticated using(user_id=gymaf_private.active_actor());
alter table public.data_requests enable row level security;
create policy request_read on public.data_requests for select to authenticated using(user_id=gymaf_private.active_actor() or gymaf_private.is_operator());

revoke all on public.app_users,public.workspaces,public.workspace_memberships,public.coaching_relationships,public.programs,public.program_versions,public.scheduled_workouts,public.workout_sessions,public.set_logs,public.check_ins,public.coach_reviews,public.messages,public.conversation_reads,public.service_entitlements,public.notifications,public.data_requests from anon,authenticated;
grant select on public.app_users,public.workspaces,public.workspace_memberships,public.coaching_relationships,public.programs,public.program_versions,public.scheduled_workouts,public.workout_sessions,public.set_logs,public.check_ins,public.coach_reviews,public.messages,public.conversation_reads,public.service_entitlements,public.notifications,public.data_requests to authenticated;
revoke all on all tables in schema gymaf_private from anon,authenticated;
revoke all on all functions in schema gymaf_private from public,anon;
grant execute on all functions in schema gymaf_private to authenticated;

create function public.gymaf_register_session() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); sid uuid := (auth.jwt()->>'session_id')::uuid;
begin
  if uid is null or sid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null)
    or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'Invalid session' using errcode='28000'; end if;
  insert into public.app_users(id) values(uid) on conflict do nothing;
  if not exists(select 1 from public.app_users where id=uid and status='active') then raise exception 'Account unavailable' using errcode='28000'; end if;
  insert into gymaf_private.application_sessions(provider_session_id,user_id) values(sid,uid) on conflict do nothing;
  if gymaf_private.active_actor() is null then raise exception 'Revoked session' using errcode='28000'; end if;
  return jsonb_build_object('id',uid);
end $$;
create function public.gymaf_revoke_session() returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Unauthenticated' using errcode='28000'; end if;
  update gymaf_private.application_sessions set revoked_at=coalesce(revoked_at,now()) where user_id=auth.uid() and provider_session_id::text=auth.jwt()->>'session_id';
  return jsonb_build_object('revoked',true);
end $$;
revoke all on function public.gymaf_register_session(),public.gymaf_revoke_session() from public,anon;
grant execute on function public.gymaf_register_session(),public.gymaf_revoke_session() to authenticated;
commit;
