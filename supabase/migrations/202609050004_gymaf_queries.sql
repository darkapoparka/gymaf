begin;
-- Explicitly qualify outer IDs to avoid accidental correlation to an inner table's id.
alter policy workspace_read on public.workspaces using(
  exists(select 1 from public.workspace_memberships m where m.workspace_id=workspaces.id and m.user_id=gymaf_private.active_actor() and m.status='active')
  or exists(select 1 from public.coaching_relationships r where r.workspace_id=workspaces.id and r.client_user_id=gymaf_private.active_actor())
);
alter policy version_read on public.program_versions using(gymaf_private.is_staff(workspace_id) or exists(select 1 from public.scheduled_workouts s where s.version_id=program_versions.id and gymaf_private.can_read_relationship(s.relationship_id)));

create function gymaf_private.operator_snapshot() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not gymaf_private.is_operator() then raise exception 'Operator permission required' using errcode='42501'; end if;
  -- Operators receive commercial/operational fields, never an implicit health-record browser.
  return jsonb_build_object(
    'workspaces',coalesce((select jsonb_agg(to_jsonb(w)) from(select id,name,slug,public_name,bio,published from public.workspaces order by created_at desc limit 100)w),'[]'::jsonb),
    'relationships',coalesce((select jsonb_agg(to_jsonb(r)) from(select id,workspace_id,client_user_id,coach_user_id,state from public.coaching_relationships order by created_at desc limit 100)r),'[]'::jsonb),
    'requests',coalesce((select jsonb_agg(to_jsonb(d)) from(select * from public.data_requests order by created_at desc limit 100)d),'[]'::jsonb)
  );
end $$;
revoke all on function gymaf_private.operator_snapshot() from public,anon;
grant execute on function gymaf_private.operator_snapshot() to authenticated;

create function public.gymaf_query(p_kind text, p_id uuid default null, p_before uuid default null) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); r public.coaching_relationships; sess public.workout_sessions;
  page jsonb; cursor_at timestamptz; last_id uuid; is_privileged boolean; needs_mfa boolean;
begin
  if actor is null then raise exception 'Invalid application session' using errcode='28000'; end if;
  if p_kind='bootstrap' then
    select exists(select 1 from public.workspace_memberships where user_id=actor and status='active') into is_privileged;
    -- Operator identity check stays inside a definer helper; low-assurance sessions see no privileged records.
    needs_mfa:=is_privileged and not gymaf_private.has_mfa();
    return jsonb_build_object(
      'user',(select to_jsonb(u)-'status'-'created_at' from public.app_users u where id=actor),
      'workspaces',coalesce((select jsonb_agg(to_jsonb(w)) from public.workspaces w where exists(select 1 from public.workspace_memberships m where m.workspace_id=w.id and m.user_id=actor and m.status='active')),'[]'::jsonb),
      'relationships',coalesce((select jsonb_agg(gymaf_private.relationship_json(id)) from public.coaching_relationships where client_user_id=actor),'[]'::jsonb),
      'operator',gymaf_private.is_operator(),'requires_mfa',needs_mfa,
      'local_mode',gymaf_private.local_mode(),
      'notifications',coalesce((select jsonb_agg(to_jsonb(n)) from(select id,kind,path,created_at,read_at from public.notifications where user_id=actor order by created_at desc limit 30)n),'[]'::jsonb)
    );
  elsif p_kind='workspace' then
    if not gymaf_private.is_staff(p_id) then raise exception 'Workspace unavailable' using errcode='42501'; end if;
    return jsonb_build_object(
      'workspace',(select to_jsonb(w) from public.workspaces w where id=p_id),
      'clients',coalesce((select jsonb_agg(gymaf_private.relationship_json(id)) from public.coaching_relationships where workspace_id=p_id and coach_user_id=actor and state in ('active','paused')),'[]'::jsonb),
      'programs',coalesce((select jsonb_agg(to_jsonb(q)) from(select * from public.programs where workspace_id=p_id order by created_at desc limit 100)q),'[]'::jsonb),
      'versions',coalesce((select jsonb_agg(to_jsonb(q)) from(select * from public.program_versions where workspace_id=p_id order by created_at desc limit 200)q),'[]'::jsonb),
      'check_ins',coalesce((select jsonb_agg(to_jsonb(q)) from(select c.*, (select jsonb_build_object('body',v.body,'created_at',v.created_at) from public.coach_reviews v where v.check_in_id=c.id) as review from public.check_ins c where workspace_id=p_id order by created_at desc limit 100)q),'[]'::jsonb)
    );
  elsif p_kind='program' then
    return (select jsonb_build_object('program',to_jsonb(pr),'versions',coalesce((select jsonb_agg(to_jsonb(v) order by v.version desc) from public.program_versions v where v.program_id=pr.id),'[]'::jsonb)) from public.programs pr where id=p_id);
  elsif p_kind='relationship' then
    select * into r from public.coaching_relationships where id=p_id;
    if not found then raise exception 'Relationship unavailable' using errcode='P0002'; end if;
    return jsonb_build_object(
      'relationship',gymaf_private.relationship_json(r.id),
      'client',(select to_jsonb(u)-'status'-'created_at' from public.app_users u where id=r.client_user_id),
      'can_train',gymaf_private.can_train(r.id),
      'workouts',coalesce((select jsonb_agg(to_jsonb(q)) from(select * from public.scheduled_workouts where relationship_id=r.id order by scheduled_date desc,id limit 200)q),'[]'::jsonb),
      'sessions',coalesce((select jsonb_agg(to_jsonb(q)) from(select * from public.workout_sessions where relationship_id=r.id order by started_at desc,id limit 200)q),'[]'::jsonb),
      'check_ins',coalesce((select jsonb_agg(to_jsonb(q)) from(select c.*, (select jsonb_build_object('body',v.body,'created_at',v.created_at) from public.coach_reviews v where v.check_in_id=c.id) as review from public.check_ins c where relationship_id=r.id order by week_start desc limit 60)q),'[]'::jsonb),
      'entitlements',coalesce((select jsonb_agg(to_jsonb(e)) from public.service_entitlements e where relationship_id=r.id),'[]'::jsonb)
    );
  elsif p_kind='session' then
    select * into sess from public.workout_sessions where id=p_id;
    if not found then raise exception 'Session unavailable' using errcode='P0002'; end if;
    return jsonb_build_object('session',to_jsonb(sess),'sets',coalesce((select jsonb_agg(to_jsonb(s) order by exercise_id,set_index) from public.set_logs s where session_id=sess.id),'[]'::jsonb),
      'editable',exists(select 1 from public.coaching_relationships where id=sess.relationship_id and client_user_id=actor and state='active') and sess.state in ('in_progress','paused'));
  elsif p_kind='messages' then
    if not gymaf_private.can_read_relationship(p_id) then raise exception 'Conversation unavailable' using errcode='P0002'; end if;
    if p_before is not null then
      select created_at into cursor_at from public.messages where id=p_before and relationship_id=p_id;
      if not found then raise exception 'Cursor unavailable' using errcode='P0002'; end if;
    end if;
    select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb) into page from(
      select id,sender_id,body,created_at from public.messages where relationship_id=p_id and (p_before is null or (created_at,id)<(cursor_at,p_before)) order by created_at desc,id desc limit 50
    )q;
    if jsonb_array_length(page)=50 then last_id:=(page->49->>'id')::uuid; end if;
    return jsonb_build_object('messages',page,'next_cursor',last_id,'other_read_at',(select max(last_read_at) from public.conversation_reads where relationship_id=p_id and user_id<>actor));
  elsif p_kind='requests' then
    return coalesce((select jsonb_agg(to_jsonb(d)) from(select * from public.data_requests where user_id=actor order by created_at desc limit 100)d),'[]'::jsonb);
  elsif p_kind='operator' then return gymaf_private.operator_snapshot();
  elsif p_kind='export' then
    -- Synchronous bounded export for local validation; reject oversized accounts rather than silently truncate.
    if (select count(*) from public.workout_sessions s join public.coaching_relationships r on r.id=s.relationship_id where r.client_user_id=actor)>1000
      or (select count(*) from public.messages m join public.coaching_relationships r on r.id=m.relationship_id where r.client_user_id=actor)>5000 then raise exception 'Use a support export request for a large account' using errcode='22023'; end if;
    return jsonb_build_object('generated_at',now(),'user',(select to_jsonb(u)-'status' from public.app_users u where id=actor),
      'relationships',coalesce((select jsonb_agg(gymaf_private.relationship_json(id)) from public.coaching_relationships where client_user_id=actor),'[]'::jsonb),
      'sessions',coalesce((select jsonb_agg(to_jsonb(s)) from public.workout_sessions s join public.coaching_relationships r on r.id=s.relationship_id where r.client_user_id=actor),'[]'::jsonb),
      'set_logs',coalesce((select jsonb_agg(to_jsonb(s)) from public.set_logs s join public.coaching_relationships r on r.id=s.relationship_id where r.client_user_id=actor),'[]'::jsonb),
      'check_ins',coalesce((select jsonb_agg(to_jsonb(c)) from public.check_ins c join public.coaching_relationships r on r.id=c.relationship_id where r.client_user_id=actor),'[]'::jsonb),
      'coach_reviews',coalesce((select jsonb_agg(to_jsonb(c)) from public.coach_reviews c join public.coaching_relationships r on r.id=c.relationship_id where r.client_user_id=actor),'[]'::jsonb),
      'messages',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'relationship_id',m.relationship_id,'body',m.body,'sent_by_me',m.sender_id=actor,'created_at',m.created_at)) from public.messages m join public.coaching_relationships r on r.id=m.relationship_id where r.client_user_id=actor),'[]'::jsonb));
  end if;
  raise exception 'Unknown query' using errcode='22023';
end $$;
-- Defined before first invocation; no reads of runtime configuration tables granted to clients.
create function gymaf_private.local_mode() returns boolean language sql stable security definer set search_path='' as $$ select synthetic_local from gymaf_private.runtime where singleton $$;
revoke all on function gymaf_private.local_mode() from public,anon;
grant execute on function gymaf_private.local_mode() to authenticated;
create function public.gymaf_public_coach(p_slug text) returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('id',id,'slug',slug,'public_name',public_name,'bio',bio) from public.workspaces where slug=p_slug and published and status='active'
$$;
revoke all on function public.gymaf_query(text,uuid,uuid) from public,anon;
grant execute on function public.gymaf_query(text,uuid,uuid) to authenticated;
revoke all on function public.gymaf_public_coach(text) from public;
grant execute on function public.gymaf_public_coach(text) to anon,authenticated;
commit;
