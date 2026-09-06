begin;
-- Account-private bookmarks. A bookmark references an existing assigned instance;
-- it never publishes a coach's draft or creates a performed workout.
create table public.workout_favorites (
  user_id uuid not null references public.app_users(id) on delete cascade,
  scheduled_id uuid not null references public.scheduled_workouts(id) on delete cascade,
  favorite boolean not null,
  revision integer not null default 1 check(revision>0),
  primary key(user_id,scheduled_id)
);
alter table public.workout_favorites enable row level security;
create policy favorite_read on public.workout_favorites for select to authenticated
  using(user_id=gymaf_private.active_actor());
revoke all on public.workout_favorites from anon,authenticated;
grant select on public.workout_favorites to authenticated;

create function public.gymaf_training_query(p_kind text,p_id uuid,p_exercise_id uuid default null) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); current_session public.workout_sessions;
begin
  if actor is null then raise exception 'Invalid application session' using errcode='28000'; end if;
  if p_kind='export-favorites' then
    return coalesce((select jsonb_agg(jsonb_build_object('scheduled_id',f.scheduled_id,'favorite',f.favorite,'revision',f.revision)) from public.workout_favorites f),'[]'::jsonb);
  elsif p_kind='favorites' then
    if not exists(select 1 from public.coaching_relationships where id=p_id and client_user_id=actor) then
      raise exception 'Library unavailable' using errcode='42501';
    end if;
    return coalesce((select jsonb_agg(jsonb_build_object('scheduled_id',f.scheduled_id,'favorite',f.favorite,'revision',f.revision))
      from public.workout_favorites f join public.scheduled_workouts w on w.id=f.scheduled_id where w.relationship_id=p_id),'[]'::jsonb);
  elsif p_kind='exercise-history' then
    select * into current_session from public.workout_sessions where id=p_id;
    if not found then raise exception 'Session unavailable' using errcode='42501'; end if;
    if not exists(select 1 from jsonb_array_elements(current_session.prescription->'exercises') e where e->>'id'=p_exercise_id::text) then
      raise exception 'Exercise unavailable' using errcode='22023';
    end if;
    -- Exact exercise identity, one authorized relationship, completed attempts only.
    -- Return a bounded list with an explicit has_more flag, not an all-time claim.
    return jsonb_build_object('as_of',now(),'entries',coalesce((select jsonb_agg(to_jsonb(q) order by q.completed_at desc,q.id desc) from (
      select s.id,s.completed_at,s.prescription->>'title' as title,
        (select jsonb_agg(jsonb_build_object('set_index',l.set_index,'actual_reps',l.actual_reps,'load_kg',l.load_kg,'duration_seconds',l.duration_seconds,'distance_m',l.distance_m,'skipped',l.skipped) order by l.set_index)
         from public.set_logs l where l.session_id=s.id and l.exercise_id=p_exercise_id) as sets
      from public.workout_sessions s where s.relationship_id=current_session.relationship_id and s.state='completed'
        and exists(select 1 from public.set_logs l where l.session_id=s.id and l.exercise_id=p_exercise_id)
      order by s.completed_at desc,s.id desc limit 100
    )q),'[]'::jsonb),'has_more',(select count(*)>100 from public.workout_sessions s where s.relationship_id=current_session.relationship_id and s.state='completed'
      and exists(select 1 from public.set_logs l where l.session_id=s.id and l.exercise_id=p_exercise_id)));
  end if;
  raise exception 'Unknown training query' using errcode='22023';
end $$;
revoke all on function public.gymaf_training_query(text,uuid,uuid) from public,anon;
grant execute on function public.gymaf_training_query(text,uuid,uuid) to authenticated;

create function public.gymaf_training_command(p_action text,p_command_id uuid,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); ident uuid; rev integer; desired boolean;
  item public.workout_favorites; previous gymaf_private.commands; fingerprint text; result jsonb;
begin
  if actor is null then raise exception 'Invalid application session' using errcode='28000'; end if;
  if p_action is distinct from 'training.favorite' or p_command_id is null or jsonb_typeof(p) is distinct from 'object'
    or (p - array['scheduledId','favorite','revision'])<>'{}'::jsonb
    or jsonb_typeof(p->'scheduledId') is distinct from 'string' or jsonb_typeof(p->'favorite') is distinct from 'boolean'
    or jsonb_typeof(p->'revision') is distinct from 'number' or not (p->>'revision' ~ '^[0-9]+$') then
    raise exception 'Invalid favorite command' using errcode='22023';
  end if;
  ident:=(p->>'scheduledId')::uuid; rev:=(p->>'revision')::integer; desired:=(p->>'favorite')::boolean;
  if rev>2147483646 then raise exception 'Invalid revision' using errcode='22023'; end if;
  if not exists(select 1 from public.scheduled_workouts w join public.coaching_relationships r on r.id=w.relationship_id where w.id=ident and r.client_user_id=actor) then
    raise exception 'Workout unavailable' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,771));
  fingerprint:=encode(extensions.digest(p_action||p::text,'sha256'),'hex');
  select * into previous from gymaf_private.commands where actor_id=actor and command_id=p_command_id;
  if found then
    if previous.action<>p_action or previous.request_hash<>fingerprint then raise exception 'Idempotency conflict' using errcode='40001'; end if;
    return previous.result;
  end if;
  select * into item from public.workout_favorites where user_id=actor and scheduled_id=ident for update;
  if coalesce(item.revision,0)<>rev then raise exception 'Favorite changed' using errcode='40001'; end if;
  if item.user_id is null and (select count(*) from public.workout_favorites where user_id=actor)>=2000 then raise exception 'Favorite limit reached' using errcode='22023'; end if;
  insert into public.workout_favorites(user_id,scheduled_id,favorite,revision) values(actor,ident,desired,rev+1)
    on conflict(user_id,scheduled_id) do update set favorite=excluded.favorite,revision=excluded.revision;
  result:=jsonb_build_object('id',ident,'revision',rev+1,'favorite',desired);
  insert into gymaf_private.commands(actor_id,command_id,action,request_hash,result) values(actor,p_command_id,p_action,fingerprint,result);
  insert into gymaf_private.audit_events(actor_id,action,resource_id,command_id) values(actor,p_action,ident,p_command_id);
  return result;
end $$;
revoke all on function public.gymaf_training_command(text,uuid,jsonb) from public,anon;
grant execute on function public.gymaf_training_command(text,uuid,jsonb) to authenticated;
commit;
