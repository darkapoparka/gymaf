\set ON_ERROR_STOP on
-- Run only in a disposable local/CI database after migrations and seed.sql.
create schema test_helpers;
grant usage on schema test_helpers to authenticated;
create function test_helpers.assert(ok boolean, label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAILED: %',label; end if; end $$;
create function test_helpers.denied(statement text) returns void language plpgsql security invoker as $$
begin
  begin execute statement;
  exception when sqlstate '42501' or sqlstate 'P0002' then return; end;
  raise exception 'Expected authorization denial';
end $$;
create function test_helpers.conflict(statement text) returns void language plpgsql security invoker as $$
begin
  begin execute statement;
  exception when sqlstate '40001' or sqlstate '23505' then return; end;
  raise exception 'Expected revision or uniqueness conflict';
end $$;
create function test_helpers.set_actor(n integer) returns void language plpgsql security invoker as $$
begin
  perform set_config('request.jwt.claims',jsonb_build_object('sub','a0000000-0000-4000-8000-'||lpad(n::text,12,'0'),'session_id','b0000000-0000-4000-8000-'||lpad(n::text,12,'0'),'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','otp','timestamp',extract(epoch from now())::bigint)))::text,false);
  perform public.gymaf_register_session();
end $$;
grant execute on all functions in schema test_helpers to authenticated;
insert into auth.users(id,email,email_confirmed_at)
select ('a0000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'synthetic-'||n||'@gymaf.example',now() from generate_series(1,6)n;
insert into auth.sessions(id,user_id)
select ('b0000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,('a0000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,6)n;
select set_config('request.jwt.claims','{"role":"service_role"}',false);
select public.gymaf_seed_synthetic('a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000005','a0000000-0000-4000-8000-000000000006');
set role authenticated;
select test_helpers.set_actor(1);
select test_helpers.assert((select count(*) from public.coaching_relationships)=2,'Coach A sees only assigned clients');
select public.gymaf_command('program.create','60000000-0000-4000-8000-000000000001','{"workspaceId":"10000000-0000-4000-8000-000000000001","title":"Synthetic training","plan":{"workouts":[{"id":"40000000-0000-4000-8000-000000000001","title":"Test workout","dayOffset":0,"exercises":[{"id":"50000000-0000-4000-8000-000000000001","name":"Synthetic exercise","instructions":"Test fixture, not training advice","sets":[{"reps":10,"loadKg":null,"durationSeconds":null,"distanceM":null,"restSeconds":60}]}]}]}}'::jsonb)->>'id' as program_id \gset
select public.gymaf_command('program.publish','60000000-0000-4000-8000-000000000002',jsonb_build_object('programId',:'program_id','revision',0))->>'id' as version_id \gset
select test_helpers.denied(format('update public.program_versions set title=%L where id=%L','Forged title',:'version_id'));
select public.gymaf_command('program.assign','60000000-0000-4000-8000-000000000003',jsonb_build_object('versionId',:'version_id','relationshipId','20000000-0000-4000-8000-000000000001','startDate','2026-09-07'));
select id as scheduled_id from public.scheduled_workouts where relationship_id='20000000-0000-4000-8000-000000000001' \gset

select test_helpers.set_actor(2);
select test_helpers.assert((select count(*) from public.programs)=0,'Coach B cannot read A program');
select test_helpers.assert((select count(*) from public.scheduled_workouts)=0,'Coach B cannot read A schedule');
select test_helpers.denied(format('select public.gymaf_query(%L,%L,null)','relationship','20000000-0000-4000-8000-000000000001'));
select test_helpers.denied(format('select public.gymaf_command(%L,%L,%L::jsonb)','program.assign','60000000-0000-4000-8000-000000000099',jsonb_build_object('versionId',:'version_id','relationshipId','20000000-0000-4000-8000-000000000003','startDate','2026-09-07')::text));

select test_helpers.set_actor(4);
select test_helpers.assert((select count(*) from public.scheduled_workouts)=0,'Sibling client cannot read another client schedule');
select test_helpers.denied(format('select public.gymaf_command(%L,%L,%L::jsonb)','session.start','60000000-0000-4000-8000-000000000098',jsonb_build_object('scheduledId',:'scheduled_id')::text));

select test_helpers.set_actor(3);
select test_helpers.assert((select count(*) from public.coaching_relationships)=1,'Client sees own relationship only');
select public.gymaf_command('session.start','60000000-0000-4000-8000-000000000004',jsonb_build_object('scheduledId',:'scheduled_id'))->>'id' as first_session \gset
select test_helpers.assert(public.gymaf_command('session.start','60000000-0000-4000-8000-000000000004',jsonb_build_object('scheduledId',:'scheduled_id'))->>'id'=:'first_session','Retry returns same attempt');
select test_helpers.conflict(format('select public.gymaf_command(%L,%L,%L::jsonb)','session.start','60000000-0000-4000-8000-000000000005',jsonb_build_object('scheduledId',:'scheduled_id')::text));
select public.gymaf_command('session.save-set','60000000-0000-4000-8000-000000000006',jsonb_build_object('sessionId',:'first_session','exerciseId','50000000-0000-4000-8000-000000000001','setIndex',0,'revision',0,'actualReps',10,'loadKg',20,'durationSeconds',null,'distanceM',null,'skipped',false));
select public.gymaf_command('session.transition','60000000-0000-4000-8000-000000000007',jsonb_build_object('sessionId',:'first_session','revision',0,'state','completed'));
select public.gymaf_command('session.transition','60000000-0000-4000-8000-000000000007',jsonb_build_object('sessionId',:'first_session','revision',0,'state','completed'));
select public.gymaf_command('session.start','60000000-0000-4000-8000-000000000008',jsonb_build_object('scheduledId',:'scheduled_id'))->>'id' as second_session \gset
select test_helpers.assert(:'first_session'<>:'second_session','Genuine repetition creates a distinct attempt');
select test_helpers.assert((select count(*) from public.workout_sessions)=2,'Both attempts remain in history');
select test_helpers.assert((select actual_reps from public.set_logs where session_id=:'first_session')=10,'Earlier actual values retained');
select test_helpers.denied(format('select public.gymaf_command(%L,%L,%L::jsonb)','session.save-set','60000000-0000-4000-8000-000000000009',jsonb_build_object('sessionId',:'first_session','exerciseId','50000000-0000-4000-8000-000000000001','setIndex',0,'revision',1,'actualReps',99,'loadKg',null,'durationSeconds',null,'distanceM',null,'skipped',false)::text));
select test_helpers.denied('update public.app_users set status=''active''');
select test_helpers.denied('insert into public.service_entitlements(workspace_id,relationship_id,source,starts_at,ends_at) values(''10000000-0000-4000-8000-000000000001'',''20000000-0000-4000-8000-000000000001'',''complimentary'',now(),now()+interval ''1 day'')');
select public.gymaf_command('message.send','60000000-0000-4000-8000-000000000010','{"relationshipId":"20000000-0000-4000-8000-000000000001","body":"Synthetic hello"}');
select public.gymaf_command('message.send','60000000-0000-4000-8000-000000000010','{"relationshipId":"20000000-0000-4000-8000-000000000001","body":"Synthetic hello"}');
select test_helpers.assert((select count(*) from public.messages)=1,'Message retry does not duplicate');
select test_helpers.conflict('select public.gymaf_command(''message.send'',''60000000-0000-4000-8000-000000000010'',''{"relationshipId":"20000000-0000-4000-8000-000000000001","body":"Different body"}'')');
select public.gymaf_command('checkin.submit','60000000-0000-4000-8000-000000000011','{"relationshipId":"20000000-0000-4000-8000-000000000001","weekStart":"2026-09-07","difficulty":5,"body":"Synthetic check-in"}')->>'id' as checkin_id \gset
select test_helpers.set_actor(1);
select test_helpers.assert((select count(*) from public.workout_sessions)=2,'Assigned coach sees recorded attempts');
select public.gymaf_command('checkin.review','60000000-0000-4000-8000-000000000012',jsonb_build_object('checkinId',:'checkin_id','body','Synthetic coach feedback'));
select test_helpers.assert((public.gymaf_query('relationship','20000000-0000-4000-8000-000000000001',null)->'check_ins'->0->'review'->>'body')='Synthetic coach feedback','Feedback is returned with the check-in');
select test_helpers.set_actor(4);
select test_helpers.assert((select count(*) from public.messages)=0,'Sibling cannot read conversation');
select test_helpers.assert((select count(*) from public.set_logs)=0,'Sibling cannot read sets');
select test_helpers.denied(format('select public.gymaf_query(%L,%L,null)','session',:'first_session'));
select test_helpers.set_actor(3);
select public.gymaf_revoke_session();
select test_helpers.assert((select count(*) from public.coaching_relationships)=0,'Revoked app session sees no records');
do $$ begin
  begin perform public.gymaf_register_session(); exception when sqlstate '28000' then return; end;
  raise exception 'Revoked session was revived';
end $$;
reset role;
select 'PASS: ownership, durable attempts, retries, immutable history, check-ins, messages and application revocation' as database_test_result;
