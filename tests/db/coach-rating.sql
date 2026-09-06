\set ON_ERROR_STOP on
begin;
insert into auth.sessions values('b0000000-0000-4000-8000-000000000013','a0000000-0000-4000-8000-000000000003');
create function test_helpers.rating_invalid(statement text) returns void language plpgsql security invoker as $$
begin begin execute statement; exception when sqlstate '22023' or sqlstate '22P02' or sqlstate '22003' then return; end; raise exception 'Expected validation denial'; end $$;
grant execute on function test_helpers.rating_invalid(text) to authenticated;
select count(*) as notice_count from public.notifications \gset
select count(*) as message_count from public.messages \gset
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a0000000-0000-4000-8000-000000000003","session_id":"b0000000-0000-4000-8000-000000000013","role":"authenticated","aal":"aal2"}',true);
select public.gymaf_register_session();
select test_helpers.assert(public.gymaf_coach_rating_query('20000000-0000-4000-8000-000000000001')->'rating'='null','No fabricated initial rating');
select public.gymaf_coach_rating_command('coach-rating.save','91000000-0000-4000-8000-000000000001','{"relationshipId":"20000000-0000-4000-8000-000000000001","revision":0,"rating":5}');
select public.gymaf_coach_rating_command('coach-rating.save','91000000-0000-4000-8000-000000000001','{"relationshipId":"20000000-0000-4000-8000-000000000001","revision":0,"rating":5}');
select test_helpers.assert(public.gymaf_coach_rating_query('20000000-0000-4000-8000-000000000001')->>'rating'='5','Rating persisted');
select test_helpers.assert(public.gymaf_coach_rating_query('20000000-0000-4000-8000-000000000001')->>'revision'='1','Retry did not duplicate');
select test_helpers.assert(jsonb_array_length(public.gymaf_coach_rating_query())=1,'Owner export contains rating');
select test_helpers.conflict($q$select public.gymaf_coach_rating_command('coach-rating.save','91000000-0000-4000-8000-000000000002','{"relationshipId":"20000000-0000-4000-8000-000000000001","revision":0,"rating":4}')$q$);
select test_helpers.conflict($q$select public.gymaf_coach_rating_command('coach-rating.save','91000000-0000-4000-8000-000000000001','{"relationshipId":"20000000-0000-4000-8000-000000000001","revision":1,"rating":4}')$q$);
select test_helpers.rating_invalid($q$select public.gymaf_coach_rating_command('coach-rating.save','91000000-0000-4000-8000-000000000002','{"relationshipId":"20000000-0000-4000-8000-000000000001","revision":1,"rating":0}')$q$);
select test_helpers.rating_invalid($q$select public.gymaf_coach_rating_command('coach-rating.save','91000000-0000-4000-8000-000000000002','{"relationshipId":"20000000-0000-4000-8000-000000000001","revision":1,"rating":2.5}')$q$);
select test_helpers.rating_invalid($q$select public.gymaf_coach_rating_command('coach-rating.save','91000000-0000-4000-8000-000000000002','{"relationshipId":"20000000-0000-4000-8000-000000000001","revision":1,"rating":4,"userId":"spoof"}')$q$);
select test_helpers.denied('update public.coach_ratings set rating=1');
select public.gymaf_coach_rating_command('coach-rating.save','91000000-0000-4000-8000-000000000003','{"relationshipId":"20000000-0000-4000-8000-000000000001","revision":1,"rating":4}');
select test_helpers.set_actor(4);
select test_helpers.assert(public.gymaf_coach_rating_query()='[]'::jsonb,'Sibling export private');
select test_helpers.denied($q$select public.gymaf_coach_rating_query('20000000-0000-4000-8000-000000000001')$q$);
select test_helpers.denied($q$select public.gymaf_coach_rating_command('coach-rating.save','91000000-0000-4000-8000-000000000004','{"relationshipId":"20000000-0000-4000-8000-000000000001","revision":2,"rating":1}')$q$);
select test_helpers.set_actor(1);
select test_helpers.assert(public.gymaf_coach_rating_query()='[]'::jsonb,'Assigned coach cannot read rating export');
select test_helpers.denied($q$select public.gymaf_coach_rating_query('20000000-0000-4000-8000-000000000001')$q$);
select test_helpers.denied($q$select public.gymaf_coach_rating_command('coach-rating.save','91000000-0000-4000-8000-000000000004','{"relationshipId":"20000000-0000-4000-8000-000000000001","revision":2,"rating":1}')$q$);
select test_helpers.set_actor(2);
select test_helpers.assert(public.gymaf_coach_rating_query()='[]'::jsonb,'Other coach cannot read rating export');
select test_helpers.denied($q$select public.gymaf_coach_rating_query('20000000-0000-4000-8000-000000000001')$q$);
reset role;
select test_helpers.assert((select count(*) from public.notifications)=:notice_count,'No coach notification');
select test_helpers.assert((select count(*) from public.messages)=:message_count,'No message sent');
update public.coaching_relationships set state='ended' where id='20000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a0000000-0000-4000-8000-000000000003","session_id":"b0000000-0000-4000-8000-000000000013","role":"authenticated","aal":"aal2"}',true);
select test_helpers.assert(public.gymaf_coach_rating_query('20000000-0000-4000-8000-000000000001')->>'canSave'='false','Ended relation rating is read-only');
select test_helpers.denied($q$select public.gymaf_coach_rating_command('coach-rating.save','91000000-0000-4000-8000-000000000001','{"relationshipId":"20000000-0000-4000-8000-000000000001","revision":0,"rating":5}')$q$);
reset role;
set local role anon;
do $$begin begin perform public.gymaf_coach_rating_query();raise exception 'Anonymous query allowed';exception when insufficient_privilege then null;end;end $$;
rollback;
