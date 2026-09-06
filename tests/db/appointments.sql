\set ON_ERROR_STOP on
begin;
-- Restore this synthetic test actor inside the rollback-only transaction after the core revocation test.
update gymaf_private.application_sessions set revoked_at=null where user_id='a0000000-0000-4000-8000-000000000003';
select count(*) as relationship_count from public.coaching_relationships \gset
set local role authenticated;
select test_helpers.set_actor(1);
select jsonb_build_object('workspaceId','10000000-0000-4000-8000-000000000001','startsAt',now()+interval '7 days','endsAt',now()+interval '7 days 30 minutes','cancelMinutes',60) as slot_payload \gset
select public.gymaf_booking_command('booking.slot-create','93000000-0000-4000-8000-000000000001',:'slot_payload')->>'id' as slot_id \gset
select test_helpers.assert(public.gymaf_booking_command('booking.slot-create','93000000-0000-4000-8000-000000000001',:'slot_payload')->>'id'=:'slot_id','Slot creation retry returns original');
select test_helpers.conflict(format('select public.gymaf_booking_command(%L,%L,%L::jsonb)','booking.slot-create','93000000-0000-4000-8000-000000000002',:'slot_payload'));
select test_helpers.assert(jsonb_array_length(public.gymaf_booking_query('10000000-0000-4000-8000-000000000001',true)->'slots')=1,'Owner sees published slot');
select test_helpers.set_actor(2);
select test_helpers.denied($q$select public.gymaf_booking_query('10000000-0000-4000-8000-000000000001',true)$q$);
select test_helpers.denied(format('select public.gymaf_booking_command(%L,%L,%L::jsonb)','booking.withdraw','93000000-0000-4000-8000-000000000003',jsonb_build_object('id',:'slot_id')));
select test_helpers.denied(format('select public.gymaf_booking_command(%L,%L,%L::jsonb)','booking.slot-create','93000000-0000-4000-8000-000000000003',:'slot_payload'));
select test_helpers.set_actor(3);
select test_helpers.assert(jsonb_array_length(public.gymaf_booking_query('10000000-0000-4000-8000-000000000001')->'slots')=1,'Connected member sees available slot');
select public.gymaf_booking_command('booking.reserve','93000000-0000-4000-8000-000000000004',jsonb_build_object('id',:'slot_id'))->>'id' as appointment_id \gset
select test_helpers.assert(public.gymaf_booking_command('booking.reserve','93000000-0000-4000-8000-000000000004',jsonb_build_object('id',:'slot_id'))->>'id'=:'appointment_id','Reservation retry does not double book');
select test_helpers.assert(jsonb_array_length(public.gymaf_booking_query()->'appointments')=1,'Member sees own appointment');
select test_helpers.assert(public.gymaf_booking_query()->'appointments'->0->'memberName'='null'::jsonb,'Member DTO contains no other identity');
select test_helpers.denied('insert into public.coach_appointments(slot_id,member_id) values(gen_random_uuid(),gen_random_uuid())');
select test_helpers.set_actor(4);
select test_helpers.assert(jsonb_array_length(public.gymaf_booking_query()->'appointments')=0,'Sibling cannot see appointment');
select test_helpers.assert((select count(*) from public.coach_appointments)=0,'Sibling direct read denied by RLS');
select test_helpers.conflict(format('select public.gymaf_booking_command(%L,%L,%L::jsonb)','booking.reserve','93000000-0000-4000-8000-000000000005',jsonb_build_object('id',:'slot_id')));
select test_helpers.denied(format('select public.gymaf_booking_command(%L,%L,%L::jsonb)','booking.cancel','93000000-0000-4000-8000-000000000005',jsonb_build_object('id',:'appointment_id')));
select test_helpers.set_actor(1);
select test_helpers.assert(jsonb_array_length(public.gymaf_booking_query('10000000-0000-4000-8000-000000000001',true)->'appointments')=1,'Owner sees booking');
select test_helpers.conflict(format('select public.gymaf_booking_command(%L,%L,%L::jsonb)','booking.withdraw','93000000-0000-4000-8000-000000000006',jsonb_build_object('id',:'slot_id')));
select test_helpers.set_actor(3);
select public.gymaf_booking_command('booking.cancel','93000000-0000-4000-8000-000000000007',jsonb_build_object('id',:'appointment_id'));
select test_helpers.assert(public.gymaf_booking_query()->'appointments'->0->>'state'='canceled','Cancellation persists');
select test_helpers.assert(jsonb_array_length(public.gymaf_booking_query('10000000-0000-4000-8000-000000000001')->'slots')=1,'Cancellation releases availability');
select test_helpers.set_actor(1);
select public.gymaf_booking_command('booking.withdraw','93000000-0000-4000-8000-000000000008',jsonb_build_object('id',:'slot_id'));
select test_helpers.set_actor(3);
select test_helpers.conflict(format('select public.gymaf_booking_command(%L,%L,%L::jsonb)','booking.reserve','93000000-0000-4000-8000-000000000009',jsonb_build_object('id',:'slot_id')));
reset role;
select test_helpers.assert((select count(*) from public.coaching_relationships)=:relationship_count,'Booking never changes coach relationships');
set local role anon;
do $$begin begin perform public.gymaf_booking_query();raise exception 'Anonymous appointments query allowed';exception when insufficient_privilege then null;end;end $$;
rollback;
