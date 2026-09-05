begin;
-- One audited, explicit command dispatcher. No dynamic SQL and no client-supplied actor authority.
-- Ordinary roles have SELECT only; definer writes authorize the exact resource before every replay/write.
create function public.gymaf_command(p_action text, p_command_id uuid, p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid := gymaf_private.active_actor(); allowed boolean := false; fingerprint text; previous gymaf_private.commands;
  r public.coaching_relationships; pr public.programs; v public.program_versions; sw public.scheduled_workouts;
  sess public.workout_sessions; sl public.set_logs; ci public.check_ins; msg public.messages; dr public.data_requests;
  inv gymaf_private.invitations; result jsonb; ident uuid; w jsonb; new_state text; seconds integer; rev integer;
  target_email text; workout jsonb; local_reason text := '';
begin
  if actor is null then raise exception 'Invalid application session' using errcode='28000'; end if;
  if p_command_id is null or p_action is null or jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>65536 then raise exception 'Invalid command' using errcode='22023'; end if;
  -- Resource authorization precedes idempotency replay; cached results cannot restore revoked access.
  case p_action
    when 'profile.save' then allowed:=true;
    when 'workspace.create' then allowed:=gymaf_private.is_operator();
    when 'workspace.publish' then allowed:=gymaf_private.is_owner((p->>'workspaceId')::uuid);
    when 'invitation.create' then allowed:=gymaf_private.is_staff((p->>'workspaceId')::uuid);
    when 'invitation.accept' then
      select * into inv from gymaf_private.invitations where token_hash=encode(extensions.digest(p->>'token','sha256'),'hex') for update;
      select lower(email) into target_email from auth.users where id=actor and email_confirmed_at is not null;
      allowed:=inv.id is not null and inv.recipient_email=target_email and inv.revoked_at is null and (inv.accepted_by is null or inv.accepted_by=actor);
    when 'program.create' then allowed:=gymaf_private.is_staff((p->>'workspaceId')::uuid);
    when 'program.save','program.publish' then
      select * into pr from public.programs where id=(p->>'programId')::uuid for update;
      allowed:=pr.id is not null and gymaf_private.is_staff(pr.workspace_id);
    when 'program.assign' then
      select * into v from public.program_versions where id=(p->>'versionId')::uuid;
      select * into r from public.coaching_relationships where id=(p->>'relationshipId')::uuid for update;
      allowed:=v.id is not null and r.id is not null and v.workspace_id=r.workspace_id and gymaf_private.is_coach(r.id);
    when 'schedule.move','session.start' then
      select * into sw from public.scheduled_workouts where id=(p->>'scheduledId')::uuid for update;
      select * into r from public.coaching_relationships where id=sw.relationship_id;
      allowed:=r.id is not null and (case when p_action='session.start' then r.client_user_id=actor else r.client_user_id=actor or gymaf_private.is_coach(r.id) end);
    when 'session.save-set','session.transition' then
      select * into sess from public.workout_sessions where id=(p->>'sessionId')::uuid for update;
      select * into r from public.coaching_relationships where id=sess.relationship_id;
      allowed:=r.id is not null and r.client_user_id=actor;
    when 'checkin.submit','message.send','message.read','service.cancel','relationship.end','entitlement.grant' then
      select * into r from public.coaching_relationships where id=(p->>'relationshipId')::uuid;
      allowed:=r.id is not null and case
        when p_action='entitlement.grant' then gymaf_private.is_operator()
        when p_action='relationship.end' then gymaf_private.is_coach(r.id) or gymaf_private.is_owner(r.workspace_id)
        when p_action in ('checkin.submit','service.cancel') then r.client_user_id=actor
        else gymaf_private.can_read_relationship(r.id) end;
    when 'checkin.review' then
      select * into ci from public.check_ins where id=(p->>'checkinId')::uuid;
      select * into r from public.coaching_relationships where id=ci.relationship_id;
      allowed:=ci.id is not null and gymaf_private.is_coach(ci.relationship_id);
    when 'request.create' then allowed:=true;
    when 'request.resolve' then
      select * into dr from public.data_requests where id=(p->>'requestId')::uuid for update;
      allowed:=dr.id is not null and gymaf_private.is_operator();
    when 'notification.read' then allowed:=exists(select 1 from public.notifications where id=(p->>'notificationId')::uuid and user_id=actor);
    else raise exception 'Unknown command' using errcode='22023';
  end case;
  if not coalesce(allowed,false) then raise exception 'Unavailable resource or permission' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text||p_command_id::text,0));
  fingerprint:=encode(extensions.digest(p_action||p::text,'sha256'),'hex');
  select * into previous from gymaf_private.commands where actor_id=actor and command_id=p_command_id;
  if found then
    if previous.request_hash<>fingerprint or previous.action<>p_action then raise exception 'Idempotency conflict' using errcode='40001'; end if;
    return previous.result;
  end if;
  ident:=gen_random_uuid();
  case p_action
    when 'profile.save' then
      if not exists(select 1 from pg_timezone_names where name=p->>'timezone') then raise exception 'Invalid timezone' using errcode='22023'; end if;
      update public.app_users set display_name=btrim(p->>'displayName'),locale=p->>'locale',timezone=p->>'timezone',goal=p->>'goal',equipment=p->>'equipment',availability=p->>'availability',revision=revision+1
        where id=actor and revision=(p->>'revision')::integer returning revision into rev;
      if not found then raise exception 'Profile revision conflict' using errcode='40001'; end if;
      ident:=actor; result:=jsonb_build_object('id',ident,'revision',rev);
    when 'workspace.create' then
      if not exists(select 1 from public.app_users where id=(p->>'coachUserId')::uuid and status='active') then raise exception 'Coach must sign in first' using errcode='22023'; end if;
      insert into public.workspaces(id,name,slug) values(ident,btrim(p->>'name'),p->>'slug');
      insert into public.workspace_memberships(workspace_id,user_id,role) values(ident,(p->>'coachUserId')::uuid,'owner');
    when 'workspace.publish' then
      if jsonb_typeof(p->'published') is distinct from 'boolean' then raise exception 'Publication flag required' using errcode='22023'; end if;
      ident:=(p->>'workspaceId')::uuid;
      update public.workspaces set public_name=btrim(p->>'publicName'),bio=p->>'bio',published=(p->>'published')::boolean where id=ident;
    when 'invitation.create' then
      if (p->>'token') is null or (p->>'token') !~ '^[a-f0-9]{64}$' or (p->>'email') is null or length(p->>'email')>254 or (p->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid invitation' using errcode='22023'; end if;
      insert into gymaf_private.invitations(id,workspace_id,coach_user_id,recipient_email,token_hash)
        values(ident,(p->>'workspaceId')::uuid,actor,lower(btrim(p->>'email')),encode(extensions.digest(p->>'token','sha256'),'hex'));
    when 'invitation.accept' then
      if inv.accepted_by=actor then ident:=inv.relationship_id;
      else
        if inv.expires_at<=now() or not exists(select 1 from public.workspace_memberships m join public.workspaces ws on ws.id=m.workspace_id where m.workspace_id=inv.workspace_id and m.user_id=inv.coach_user_id and m.status='active' and ws.status='active') then raise exception 'Invitation unavailable' using errcode='42501'; end if;
        insert into public.coaching_relationships(id,workspace_id,client_user_id,coach_user_id) values(ident,inv.workspace_id,actor,inv.coach_user_id);
        update gymaf_private.invitations set accepted_by=actor,relationship_id=ident,accepted_at=now() where id=inv.id;
      end if;
    when 'program.create' then
      perform gymaf_private.valid_plan(p->'plan');
      insert into public.programs(id,workspace_id,title,draft) values(ident,(p->>'workspaceId')::uuid,btrim(p->>'title'),p->'plan');
      result:=jsonb_build_object('id',ident,'revision',0);
    when 'program.save' then
      perform gymaf_private.valid_plan(p->'plan'); ident:=pr.id;
      update public.programs set title=btrim(p->>'title'),draft=p->'plan',revision=revision+1 where id=ident and revision=(p->>'revision')::integer returning revision into rev;
      if not found then raise exception 'Draft revision conflict' using errcode='40001'; end if;
      result:=jsonb_build_object('id',ident,'revision',rev);
    when 'program.publish' then
      if (p->>'revision')::integer is distinct from pr.revision then raise exception 'Draft revision conflict' using errcode='40001'; end if;
      select coalesce(max(version),0)+1 into rev from public.program_versions where program_id=pr.id;
      insert into public.program_versions(id,workspace_id,program_id,title,version,plan) values(ident,pr.workspace_id,pr.id,pr.title,rev,pr.draft);
      update public.programs set revision=revision+1 where id=pr.id;
    when 'program.assign' then
      if (p->>'startDate') is null or p->>'startDate' !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Start date required' using errcode='22023'; end if;
      for w in select value from jsonb_array_elements(v.plan->'workouts') loop
        insert into public.scheduled_workouts(workspace_id,relationship_id,assignment_id,version_id,workout_id,prescription,scheduled_date,timezone)
        select r.workspace_id,r.id,ident,v.id,(w->>'id')::uuid,w,(p->>'startDate')::date+(w->>'dayOffset')::integer,u.timezone from public.app_users u where u.id=r.client_user_id;
      end loop;
      insert into public.notifications(user_id,event_id,kind,path) values(r.client_user_id,p_command_id,'program_assigned','/app');
    when 'schedule.move' then
      if not gymaf_private.can_train(r.id) or sw.state<>'assigned' then raise exception 'Schedule cannot be moved' using errcode='42501'; end if;
      ident:=sw.id;
      update public.scheduled_workouts set scheduled_date=(p->>'date')::date,revision=revision+1 where id=ident and revision=(p->>'revision')::integer returning revision into rev;
      if not found then raise exception 'Schedule revision conflict' using errcode='40001'; end if;
      result:=jsonb_build_object('id',ident,'revision',rev);
    when 'session.start' then
      if not gymaf_private.can_train(r.id) or sw.state='canceled' then raise exception 'Active service required' using errcode='42501'; end if;
      insert into public.workout_sessions(id,workspace_id,relationship_id,scheduled_workout_id,prescription) values(ident,r.workspace_id,r.id,sw.id,sw.prescription);
      result:=jsonb_build_object('id',ident,'revision',0);
    when 'session.save-set' then
      if r.state<>'active' or sess.state not in ('in_progress','paused') or not exists(select 1 from public.workspaces where id=r.workspace_id and status='active') then raise exception 'Session is not editable' using errcode='42501'; end if;
      perform gymaf_private.check_number(p->'actualReps',0,1000,true,true);
      perform gymaf_private.check_number(p->'loadKg',0,1000,false,true);
      perform gymaf_private.check_number(p->'durationSeconds',0,86400,false,true);
      perform gymaf_private.check_number(p->'distanceM',0,1000000,false,true);
      perform gymaf_private.check_number(p->'setIndex',0,19,true,false);
      if jsonb_typeof(p->'skipped') is distinct from 'boolean' then raise exception 'Skipped flag required' using errcode='22023'; end if;
      if (p->>'skipped')::boolean and ((p->>'actualReps') is not null or (p->>'loadKg') is not null or (p->>'durationSeconds') is not null or (p->>'distanceM') is not null) then raise exception 'Skipped sets cannot contain actual values' using errcode='22023'; end if;
      select * into sl from public.set_logs where session_id=sess.id and exercise_id=(p->>'exerciseId')::uuid and set_index=(p->>'setIndex')::integer for update;
      if found then
        if sl.revision is distinct from (p->>'revision')::integer then raise exception 'Set revision conflict' using errcode='40001'; end if;
        ident:=sl.id;
        update public.set_logs set actual_reps=(p->>'actualReps')::integer,load_kg=(p->>'loadKg')::numeric,duration_seconds=(p->>'durationSeconds')::numeric,distance_m=(p->>'distanceM')::numeric,skipped=(p->>'skipped')::boolean,revision=revision+1,updated_at=now() where id=ident returning revision into rev;
      else
        if (p->>'revision')::integer is distinct from 0 then raise exception 'Missing set revision' using errcode='40001'; end if;
        insert into public.set_logs(id,workspace_id,relationship_id,session_id,exercise_id,set_index,actual_reps,load_kg,duration_seconds,distance_m,skipped)
        values(ident,r.workspace_id,r.id,sess.id,(p->>'exerciseId')::uuid,(p->>'setIndex')::integer,(p->>'actualReps')::integer,(p->>'loadKg')::numeric,(p->>'durationSeconds')::numeric,(p->>'distanceM')::numeric,(p->>'skipped')::boolean) returning revision into rev;
      end if;
      result:=jsonb_build_object('id',ident,'revision',rev);
    when 'session.transition' then
      new_state:=p->>'state';
      if new_state is null or new_state not in ('in_progress','paused','completed','abandoned') then raise exception 'Invalid session state' using errcode='22023'; end if;
      if r.state<>'active' or sess.state not in ('in_progress','paused') then raise exception 'Session is not editable' using errcode='42501'; end if;
      if sess.revision is distinct from (p->>'revision')::integer then raise exception 'Session revision conflict' using errcode='40001'; end if;
      if new_state='completed' and not exists(select 1 from public.set_logs where session_id=sess.id and not skipped and (actual_reps>0 or duration_seconds>0 or distance_m>0)) then raise exception 'Record a performed set or abandon the session' using errcode='22023'; end if;
      ident:=sess.id; seconds:=least(2147483647,sess.elapsed_seconds+case when sess.running_since is null then 0 else greatest(0,floor(extract(epoch from clock_timestamp()-sess.running_since))) end)::integer;
      update public.workout_sessions set state=new_state,elapsed_seconds=seconds,running_since=case when new_state='in_progress' then clock_timestamp() else null end,
        completed_at=case when new_state in ('completed','abandoned') then now() else null end,revision=revision+1 where id=ident returning revision into rev;
      if new_state='completed' then
        update public.scheduled_workouts set state='completed',revision=revision+1 where id=sess.scheduled_workout_id and state='assigned';
        insert into public.notifications(user_id,event_id,kind,path) values(r.coach_user_id,p_command_id,'workout_completed','/coach/clients/'||r.id::text);
      end if;
      result:=jsonb_build_object('id',ident,'revision',rev);
    when 'checkin.submit' then
      if not gymaf_private.can_train(r.id) then raise exception 'Active service required' using errcode='42501'; end if;
      insert into public.check_ins(id,workspace_id,relationship_id,week_start,difficulty,body) values(ident,r.workspace_id,r.id,(p->>'weekStart')::date,(p->>'difficulty')::integer,p->>'body');
      insert into public.notifications(user_id,event_id,kind,path) values(r.coach_user_id,p_command_id,'checkin_submitted','/coach/clients/'||r.id::text);
    when 'checkin.review' then
      insert into public.coach_reviews(id,workspace_id,relationship_id,check_in_id,author_id,body) values(ident,r.workspace_id,r.id,ci.id,actor,btrim(p->>'body'));
      insert into public.notifications(user_id,event_id,kind,path) values(r.client_user_id,p_command_id,'coach_feedback','/app/check-ins');
    when 'message.send' then
      if not gymaf_private.can_train(r.id) then raise exception 'Active service required' using errcode='42501'; end if;
      insert into public.messages(id,workspace_id,relationship_id,sender_id,body) values(ident,r.workspace_id,r.id,actor,btrim(p->>'body'));
      insert into public.notifications(user_id,event_id,kind,path) values(case when actor=r.client_user_id then r.coach_user_id else r.client_user_id end,p_command_id,'message',case when actor=r.client_user_id then '/coach/clients/'||r.id::text else '/app/messages' end);
    when 'message.read' then
      select * into msg from public.messages where id=(p->>'messageId')::uuid and relationship_id=r.id;
      if not found then raise exception 'Message unavailable' using errcode='42501'; end if;
      insert into public.conversation_reads(relationship_id,user_id,last_read_at) values(r.id,actor,msg.created_at)
        on conflict(relationship_id,user_id) do update set last_read_at=greatest(public.conversation_reads.last_read_at,excluded.last_read_at);
      ident:=msg.id;
    when 'entitlement.grant' then
      if r.state<>'active' then raise exception 'Relationship must be active' using errcode='22023'; end if;
      local_reason:=btrim(p->>'reason'); if local_reason is null or length(local_reason) not between 1 and 500 then raise exception 'Audit reason required' using errcode='22023'; end if;
      insert into public.service_entitlements(id,workspace_id,relationship_id,source,starts_at,ends_at) values(ident,r.workspace_id,r.id,p->>'source',(p->>'startsAt')::timestamptz,(p->>'endsAt')::timestamptz);
    when 'service.cancel' then
      update public.service_entitlements set state='canceled',cancellation_requested_at=coalesce(cancellation_requested_at,now()) where relationship_id=r.id and state='active';
      ident:=r.id;
      insert into public.notifications(user_id,event_id,kind,path) values(r.coach_user_id,p_command_id,'service_canceled','/coach/clients/'||r.id::text);
    when 'relationship.end' then
      ident:=r.id;
      update public.coaching_relationships set state='ended',ended_at=coalesce(ended_at,now()) where id=r.id;
      update public.service_entitlements set state='revoked' where relationship_id=r.id and state<>'revoked';
      update public.scheduled_workouts set state='canceled',revision=revision+1 where relationship_id=r.id and state='assigned';
    when 'request.create' then insert into public.data_requests(id,user_id,kind,body) values(ident,actor,p->>'kind',p->>'body');
    when 'request.resolve' then
      if dr.kind='deletion' and p->>'state'='closed' then raise exception 'Deletion requires a separately approved erasure workflow; acknowledgement only' using errcode='22023'; end if;
      ident:=dr.id;
      update public.data_requests set state=p->>'state',resolution=p->>'resolution' where id=ident;
    when 'notification.read' then ident:=(p->>'notificationId')::uuid; update public.notifications set read_at=coalesce(read_at,now()) where id=ident and user_id=actor;
  end case;
  result:=coalesce(result,jsonb_build_object('id',ident));
  insert into gymaf_private.commands(actor_id,command_id,action,request_hash,result) values(actor,p_command_id,p_action,fingerprint,result);
  insert into gymaf_private.audit_events(actor_id,action,resource_id,command_id,reason) values(actor,p_action,ident,p_command_id,local_reason);
  return result;
end $$;
revoke all on function public.gymaf_command(text,uuid,jsonb) from public,anon;
grant execute on function public.gymaf_command(text,uuid,jsonb) to authenticated;
commit;
