\set ON_ERROR_STOP on
-- Disposable local/CI database only, after coaching.sql. The revoked session stays revoked.
begin;
insert into auth.sessions values('b0000000-0000-4000-8000-000000000013','a0000000-0000-4000-8000-000000000003');
select id as scheduled_id from public.scheduled_workouts where relationship_id='20000000-0000-4000-8000-000000000001' limit 1 \gset
select id as session_id from public.workout_sessions where relationship_id='20000000-0000-4000-8000-000000000001' and state='completed' limit 1 \gset
create function test_helpers.training_invalid(statement text) returns void language plpgsql security invoker as $$
begin
  begin execute statement; exception when sqlstate '22023' or sqlstate '22P02' or sqlstate '22003' then return; end;
  raise exception 'Expected validation denial';
end $$;
grant execute on function test_helpers.training_invalid(text) to authenticated;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a0000000-0000-4000-8000-000000000003","session_id":"b0000000-0000-4000-8000-000000000013","role":"authenticated","aal":"aal2"}',true);
select public.gymaf_register_session();
select test_helpers.assert(public.gymaf_training_query('favorites','20000000-0000-4000-8000-000000000001')='[]'::jsonb,'Favorites initially empty');
select public.gymaf_training_command('training.favorite','81000000-0000-4000-8000-000000000001',jsonb_build_object('scheduledId',:'scheduled_id','favorite',true,'revision',0));
select public.gymaf_training_command('training.favorite','81000000-0000-4000-8000-000000000001',jsonb_build_object('scheduledId',:'scheduled_id','favorite',true,'revision',0));
select test_helpers.assert((select count(*)=1 and max(revision)=1 from public.workout_favorites),'Retry keeps one acknowledged favorite');
select test_helpers.assert(public.gymaf_training_query('favorites','20000000-0000-4000-8000-000000000001')->0->>'favorite'='true','Favorite survives separate query');
select test_helpers.conflict(format('select public.gymaf_training_command(%L,%L,%L::jsonb)','training.favorite','81000000-0000-4000-8000-000000000002',jsonb_build_object('scheduledId',:'scheduled_id','favorite',false,'revision',0)::text));
select test_helpers.conflict(format('select public.gymaf_training_command(%L,%L,%L::jsonb)','training.favorite','81000000-0000-4000-8000-000000000001',jsonb_build_object('scheduledId',:'scheduled_id','favorite',false,'revision',1)::text));
select test_helpers.training_invalid(format('select public.gymaf_training_command(%L,%L,%L::jsonb)','training.favorite','81000000-0000-4000-8000-000000000002',jsonb_build_object('scheduledId',:'scheduled_id','favorite',null,'revision',1)::text));
select test_helpers.training_invalid(format('select public.gymaf_training_command(%L,%L,%L::jsonb)','training.favorite','81000000-0000-4000-8000-000000000002',jsonb_build_object('scheduledId',:'scheduled_id','favorite',true,'revision',1,'user_id','a0000000-0000-4000-8000-000000000004')::text));
select test_helpers.denied('update public.workout_favorites set favorite=false');
select test_helpers.assert(jsonb_array_length(public.gymaf_training_query('export-favorites',null))=1,'Export includes own favorites');
select test_helpers.assert(public.gymaf_training_query('exercise-history',:'session_id','50000000-0000-4000-8000-000000000001')->'entries'->0->'sets'->0->>'actual_reps'='10','History returns actual completed sets');
select test_helpers.assert(jsonb_array_length(public.gymaf_training_query('exercise-history',:'session_id','50000000-0000-4000-8000-000000000001')->'entries')=1,'Incomplete attempts excluded');
select test_helpers.training_invalid(format('select public.gymaf_training_query(%L,%L,%L)','exercise-history',:'session_id','50000000-0000-4000-8000-000000000099'));
select public.gymaf_training_command('training.favorite','81000000-0000-4000-8000-000000000002',jsonb_build_object('scheduledId',:'scheduled_id','favorite',false,'revision',1));
select test_helpers.assert(public.gymaf_training_query('favorites','20000000-0000-4000-8000-000000000001')->0->>'favorite'='false','Unfavorite is durable with revision');
select test_helpers.set_actor(4);
select test_helpers.assert((select count(*) from public.workout_favorites)=0,'Sibling cannot read favorites');
select test_helpers.assert(public.gymaf_training_query('export-favorites',null)='[]'::jsonb,'Export excludes sibling favorites');
select test_helpers.denied(format('select public.gymaf_training_command(%L,%L,%L::jsonb)','training.favorite','81000000-0000-4000-8000-000000000003',jsonb_build_object('scheduledId',:'scheduled_id','favorite',true,'revision',0)::text));
select test_helpers.denied(format('select public.gymaf_training_query(%L,%L,%L)','exercise-history',:'session_id','50000000-0000-4000-8000-000000000001'));
select test_helpers.denied($q$select public.gymaf_training_query('favorites','20000000-0000-4000-8000-000000000001')$q$);
select test_helpers.set_actor(2);
select test_helpers.assert((select count(*) from public.workout_favorites)=0,'Other coach cannot read favorites');
select test_helpers.denied(format('select public.gymaf_training_query(%L,%L,%L)','exercise-history',:'session_id','50000000-0000-4000-8000-000000000001'));
select test_helpers.denied(format('select public.gymaf_training_command(%L,%L,%L::jsonb)','training.favorite','81000000-0000-4000-8000-000000000003',jsonb_build_object('scheduledId',:'scheduled_id','favorite',true,'revision',0)::text));
select test_helpers.set_actor(1);
select test_helpers.assert((select count(*) from public.workout_favorites)=0,'Assigned coach cannot read private favorites');
select test_helpers.assert(jsonb_array_length(public.gymaf_training_query('exercise-history',:'session_id','50000000-0000-4000-8000-000000000001')->'entries')=1,'Assigned coach can read already-authorized exercise history');
reset role;
select test_helpers.assert(not has_function_privilege('anon','public.gymaf_training_query(text,uuid,uuid)','execute'),'Anonymous query denied');
select test_helpers.assert(not has_function_privilege('anon','public.gymaf_training_command(text,uuid,jsonb)','execute'),'Anonymous mutation denied');
select test_helpers.assert(not has_table_privilege('authenticated','public.workout_favorites','insert'),'Direct inserts denied');
rollback;
select 'PASS: favorites persistence, retries, revision conflicts and exercise-history privacy' as result;
