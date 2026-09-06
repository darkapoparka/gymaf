begin;
-- Draft feedback is private. Coaches receive an explicit, immutable-until-resubmitted snapshot.
create table public.session_feedback (
  session_id uuid primary key references public.workout_sessions(id) on delete cascade,
  draft jsonb not null,
  revision integer not null check(revision>0),
  shared_snapshot jsonb,
  shared_revision integer,
  shared_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((shared_snapshot is null and shared_revision is null and shared_at is null)
    or (shared_snapshot is not null and shared_revision between 1 and revision and shared_at is not null))
);
alter table public.session_feedback enable row level security;
create policy feedback_owner_read on public.session_feedback for select to authenticated using (
  exists(select 1 from public.workout_sessions s join public.coaching_relationships r on r.id=s.relationship_id
    where s.id=session_id and r.client_user_id=gymaf_private.active_actor())
);
revoke all on public.session_feedback from anon,authenticated;
grant select on public.session_feedback to authenticated;

create function public.gymaf_feedback_query(p_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); s public.workout_sessions; r public.coaching_relationships; f public.session_feedback; own boolean;
begin
  if actor is null then raise exception 'Invalid application session' using errcode='28000'; end if;
  if p_id is null then
    return coalesce((select jsonb_agg(to_jsonb(feedback_row)) from public.session_feedback feedback_row join public.workout_sessions attempt on attempt.id=feedback_row.session_id
      join public.coaching_relationships relationship_row on relationship_row.id=attempt.relationship_id where relationship_row.client_user_id=actor),'[]'::jsonb);
  end if;
  select * into s from public.workout_sessions where id=p_id;
  if s.id is null or not gymaf_private.can_read_relationship(s.relationship_id) then raise exception 'Session unavailable' using errcode='42501'; end if;
  select * into r from public.coaching_relationships where id=s.relationship_id;
  own:=r.client_user_id=actor;
  select * into f from public.session_feedback where session_id=p_id;
  return jsonb_build_object('sessionId',p_id,'editable',own,
    'canSubmit',own and r.state='active' and s.state in ('completed','abandoned') and exists(select 1 from public.workspaces where id=r.workspace_id and status='active'),
    'coachName',(select display_name from public.app_users where id=r.coach_user_id),
    'revision',case when own then coalesce(f.revision,0) else coalesce(f.shared_revision,0) end,
    'data',case when own then coalesce(f.draft,'{"rating":null,"difficulty":null,"body":"","flags":[]}'::jsonb) else f.shared_snapshot end,
    'sharedRevision',f.shared_revision,'sharedAt',f.shared_at);
end $$;
revoke all on function public.gymaf_feedback_query(uuid) from public,anon;
grant execute on function public.gymaf_feedback_query(uuid) to authenticated;

create function public.gymaf_feedback_command(p_action text,p_command_id uuid,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); ident uuid; rev integer; d jsonb; flag jsonb; value jsonb;
  s public.workout_sessions; r public.coaching_relationships; f public.session_feedback;
  previous gymaf_private.commands; fingerprint text; result jsonb; seen text[]:='{}';
begin
  if actor is null then raise exception 'Invalid application session' using errcode='28000'; end if;
  if p_action is null or p_action not in ('feedback.save','feedback.submit') or p_command_id is null
    or jsonb_typeof(p) is distinct from 'object' or (p-array['sessionId','revision','data'])<>'{}'::jsonb
    or jsonb_typeof(p->'sessionId') is distinct from 'string' or jsonb_typeof(p->'revision') is distinct from 'number'
    or not(p->>'revision' ~ '^[0-9]+$') then raise exception 'Invalid feedback command' using errcode='22023'; end if;
  ident:=(p->>'sessionId')::uuid; rev:=(p->>'revision')::integer;
  if rev>2147483646 then raise exception 'Invalid revision' using errcode='22023'; end if;
  select * into s from public.workout_sessions where id=ident;
  select * into r from public.coaching_relationships where id=s.relationship_id;
  if r.id is null or r.client_user_id<>actor then raise exception 'Session unavailable' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,771));
  fingerprint:=encode(extensions.digest(p_action||p::text,'sha256'),'hex');
  select * into previous from gymaf_private.commands where actor_id=actor and command_id=p_command_id;
  if found then
    if previous.action<>p_action or previous.request_hash<>fingerprint then raise exception 'Idempotency conflict' using errcode='GY409'; end if;
    return previous.result;
  end if;
  select * into f from public.session_feedback where session_id=ident for update;
  if coalesce(f.revision,0)<>rev then raise exception 'Feedback changed' using errcode='GY409'; end if;
  if p_action='feedback.save' then
    d:=p->'data';
    if jsonb_typeof(d) is distinct from 'object' or (d-array['rating','difficulty','body','flags'])<>'{}'::jsonb
      or not(d ?& array['rating','difficulty','body','flags']) or jsonb_typeof(d->'body') is distinct from 'string'
      or length(d->>'body')>2000 or jsonb_typeof(d->'flags') is distinct from 'array' then raise exception 'Invalid feedback' using errcode='22023'; end if;
    foreach value in array array[d->'rating',d->'difficulty'] loop
      if value<>'null'::jsonb and (jsonb_typeof(value)<>'number' or value::text !~ '^[1-5]$') then raise exception 'Invalid rating' using errcode='22023'; end if;
    end loop;
    if jsonb_array_length(d->'flags')>30 then raise exception 'Too many flags' using errcode='22023'; end if;
    for flag in select * from jsonb_array_elements(d->'flags') loop
      if jsonb_typeof(flag) is distinct from 'object' or (flag-array['exerciseId','reasons','comment'])<>'{}'::jsonb
        or jsonb_typeof(flag->'exerciseId') is distinct from 'string' or jsonb_typeof(flag->'comment') is distinct from 'string'
        or length(flag->>'comment')>1000 or jsonb_typeof(flag->'reasons') is distinct from 'array' then raise exception 'Invalid flag' using errcode='22023'; end if;
      if flag->>'exerciseId'=any(seen) or not exists(select 1 from jsonb_array_elements(s.prescription->'exercises') e where e->>'id'=flag->>'exerciseId')
        or jsonb_array_length(flag->'reasons') not between 1 and 9
        or (select count(distinct v) from jsonb_array_elements(flag->'reasons') v)<>jsonb_array_length(flag->'reasons')
        or exists(select 1 from jsonb_array_elements(flag->'reasons') v where jsonb_typeof(v)<>'string' or v #>> '{}' not in
          ('Dislike','Too Hard','Too Easy','Injured','Mix It Up','Traveling','Equipment Busy','Uncomfortable','Missing Equipment'))
      then raise exception 'Invalid flag selection' using errcode='22023'; end if;
      seen:=array_append(seen,flag->>'exerciseId');
    end loop;
    insert into public.session_feedback(session_id,draft,revision) values(ident,d,rev+1)
      on conflict(session_id) do update set draft=excluded.draft,revision=excluded.revision,updated_at=now();
    result:=jsonb_build_object('id',ident,'revision',rev+1);
  else
    if p ? 'data' then raise exception 'Submit the saved revision' using errcode='22023'; end if;
    -- Lock relationship and session so concurrent ending cannot race an explicit submission.
    select * into r from public.coaching_relationships where id=s.relationship_id for share;
    select * into s from public.workout_sessions where id=ident for share;
    if r.state<>'active' or not exists(select 1 from public.workspaces where id=r.workspace_id and status='active')
      then raise exception 'Coaching relationship unavailable' using errcode='42501'; end if;
    if s.state not in ('completed','abandoned') or f.session_id is null or (f.draft->'rating'='null'::jsonb and f.draft->'difficulty'='null'::jsonb
      and btrim(f.draft->>'body')='' and jsonb_array_length(f.draft->'flags')=0) then raise exception 'Feedback is not ready' using errcode='22023'; end if;
    if f.shared_revision is distinct from rev then
      update public.session_feedback set shared_snapshot=draft,shared_revision=revision,shared_at=now() where session_id=ident;
      insert into public.notifications(user_id,event_id,kind,path) values(r.coach_user_id,p_command_id,'Workout feedback','/coach/sessions/'||ident::text);
    end if;
    result:=jsonb_build_object('id',ident,'revision',rev);
  end if;
  insert into gymaf_private.commands(actor_id,command_id,action,request_hash,result) values(actor,p_command_id,p_action,fingerprint,result);
  insert into gymaf_private.audit_events(actor_id,action,resource_id,command_id) values(actor,p_action,ident,p_command_id);
  return result;
end $$;
revoke all on function public.gymaf_feedback_command(text,uuid,jsonb) from public,anon;
grant execute on function public.gymaf_feedback_command(text,uuid,jsonb) to authenticated;
commit;
