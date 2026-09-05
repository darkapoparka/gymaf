begin;
create function gymaf_private.check_number(v jsonb, lo numeric, hi numeric, whole boolean, nullable boolean) returns void language plpgsql immutable set search_path='' as $$
declare n numeric;
begin
  if v='null'::jsonb and nullable then return; end if;
  if jsonb_typeof(v) is distinct from 'number' then raise exception 'Numeric value required' using errcode='22023'; end if;
  n:=(v#>>'{}')::numeric;
  if n<lo or n>hi or (whole and trunc(n)<>n) then raise exception 'Numeric value out of range' using errcode='22023'; end if;
end $$;
create function gymaf_private.valid_plan(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare w jsonb; e jsonb; s jsonb; seen uuid[] := '{}'; ident uuid;
begin
  if jsonb_typeof(p) is distinct from 'object' or jsonb_typeof(p->'workouts') is distinct from 'array' or octet_length(p::text)>65536 then raise exception 'Invalid plan' using errcode='22023'; end if;
  if jsonb_array_length(p->'workouts') not between 1 and 56 then raise exception 'Invalid workout count' using errcode='22023'; end if;
  for w in select value from jsonb_array_elements(p->'workouts') loop
    if jsonb_typeof(w) is distinct from 'object' or jsonb_typeof(w->'title') is distinct from 'string' or length(btrim(w->>'title')) not between 1 and 120 then raise exception 'Workout title required' using errcode='22023'; end if;
    ident:=(w->>'id')::uuid;
    if ident is null or ident=any(seen) then raise exception 'Duplicate/missing ID' using errcode='22023'; end if; seen:=array_append(seen,ident);
    perform gymaf_private.check_number(w->'dayOffset',0,365,true,false);
    if jsonb_typeof(w->'exercises') is distinct from 'array' then raise exception 'Exercises required' using errcode='22023'; end if;
    if jsonb_array_length(w->'exercises') not between 1 and 30 then raise exception 'Invalid exercise count' using errcode='22023'; end if;
    for e in select value from jsonb_array_elements(w->'exercises') loop
      if jsonb_typeof(e) is distinct from 'object' or jsonb_typeof(e->'name') is distinct from 'string' or length(btrim(e->>'name')) not between 1 and 120
        or jsonb_typeof(e->'instructions') is distinct from 'string' or length(e->>'instructions')>2000 then raise exception 'Invalid exercise' using errcode='22023'; end if;
      ident:=(e->>'id')::uuid;
      if ident is null or ident=any(seen) then raise exception 'Duplicate/missing ID' using errcode='22023'; end if; seen:=array_append(seen,ident);
      if jsonb_typeof(e->'sets') is distinct from 'array' then raise exception 'Sets required' using errcode='22023'; end if;
      if jsonb_array_length(e->'sets') not between 1 and 20 then raise exception 'Invalid set count' using errcode='22023'; end if;
      for s in select value from jsonb_array_elements(e->'sets') loop
        perform gymaf_private.check_number(s->'reps',1,1000,true,true);
        perform gymaf_private.check_number(s->'loadKg',0,1000,false,true);
        perform gymaf_private.check_number(s->'durationSeconds',0,86400,false,true);
        perform gymaf_private.check_number(s->'distanceM',0,1000000,false,true);
        perform gymaf_private.check_number(s->'restSeconds',0,3600,true,false);
        if coalesce((s->>'reps')::numeric,0)+coalesce((s->>'durationSeconds')::numeric,0)+coalesce((s->>'distanceM')::numeric,0)<=0 then raise exception 'A set target is required' using errcode='22023'; end if;
      end loop;
    end loop;
  end loop;
  return true;
end $$;
alter table public.programs add constraint program_draft_valid check(gymaf_private.valid_plan(draft));
alter table public.program_versions add constraint published_plan_valid check(gymaf_private.valid_plan(plan));
create function gymaf_private.immutable_version() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Published versions cannot be modified' using errcode='42501'; end $$;
create trigger immutable_program_versions before update or delete on public.program_versions for each row execute function gymaf_private.immutable_version();
create function gymaf_private.protect_session() returns trigger language plpgsql set search_path='' as $$
begin
  if old.state in ('completed','abandoned') or new.workspace_id<>old.workspace_id or new.relationship_id<>old.relationship_id
    or new.scheduled_workout_id<>old.scheduled_workout_id or new.prescription<>old.prescription or new.started_at<>old.started_at then
    raise exception 'Session history is immutable' using errcode='42501';
  end if;
  return new;
end $$;
create trigger protect_session_history before update on public.workout_sessions for each row execute function gymaf_private.protect_session();
create function gymaf_private.protect_set() returns trigger language plpgsql security definer set search_path='' as $$
declare sess public.workout_sessions; exercise jsonb;
begin
  select * into sess from public.workout_sessions where id=new.session_id for update;
  if not found or sess.state not in ('in_progress','paused') or sess.relationship_id<>new.relationship_id or sess.workspace_id<>new.workspace_id then raise exception 'Session is not editable' using errcode='42501'; end if;
  select value into exercise from jsonb_array_elements(sess.prescription->'exercises') where (value->>'id')::uuid=new.exercise_id;
  if exercise is null or new.set_index>=jsonb_array_length(exercise->'sets') then raise exception 'Set not in prescription' using errcode='22023'; end if;
  if tg_op='UPDATE' and (new.session_id<>old.session_id or new.exercise_id<>old.exercise_id or new.set_index<>old.set_index or new.relationship_id<>old.relationship_id or new.workspace_id<>old.workspace_id) then raise exception 'Set ownership is immutable' using errcode='42501'; end if;
  return new;
end $$;
create trigger protect_set_write before insert or update on public.set_logs for each row execute function gymaf_private.protect_set();
revoke all on all functions in schema gymaf_private from public,anon;
-- Read-policy helper execution is needed by invoker queries; integrity helpers reveal no private records.
grant execute on all functions in schema gymaf_private to authenticated;
commit;
