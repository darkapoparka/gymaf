\set ON_ERROR_STOP on
-- After coaching.sql in an isolated disposable database. Provider JWT is simulated.
begin;
create function test_helpers.invalid(statement text) returns void language plpgsql security invoker as $$
begin
  begin execute statement; exception when sqlstate '22023' or sqlstate '22P02' or sqlstate '22003' then return; end;
  raise exception 'Expected validation denial';
end $$;
grant execute on function test_helpers.invalid(text) to authenticated;
insert into auth.users values('a0000000-0000-4000-8000-000000000007','member-test@gymaf.example',now());
insert into auth.sessions values('b0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000007');
set local role authenticated;
select test_helpers.set_actor(7);
select test_helpers.assert(public.gymaf_member_query()='[]'::jsonb,'New account has no seeded reference values');
select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000001','{"id":"72000000-0000-4000-8000-000000000001","kind":"weight","revision":0,"data":{"date":"2026-09-06","valueKg":75.2}}');
select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000001','{"id":"72000000-0000-4000-8000-000000000001","kind":"weight","revision":0,"data":{"date":"2026-09-06","valueKg":75.2}}');
select test_helpers.assert((select count(*) from public.member_records)=1,'Retry does not duplicate a measurement');
select test_helpers.assert(public.gymaf_member_query()->0->'data'->>'valueKg'='75.2','Measurement survives a separate query');
select test_helpers.assert(not(public.gymaf_member_query()->0 ? 'user_id'),'DTO excludes owner identity');
select test_helpers.denied($q$update public.member_records set user_id='a0000000-0000-4000-8000-000000000004'$q$);
select test_helpers.invalid($q$select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000002','{"id":"72000000-0000-4000-8000-000000000002","kind":"weight","revision":0,"data":{"date":"2026-02-31","valueKg":75}}')$q$);
select test_helpers.invalid($q$select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000002','{"id":"72000000-0000-4000-8000-000000000002","kind":"weight","revision":0,"data":{"date":"2026-09-06","valueKg":-1}}')$q$);
select test_helpers.invalid($q$select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000002','{"id":"72000000-0000-4000-8000-000000000002","kind":"location","revision":0,"data":{"name":"Home","type":"Home","equipment":["Dumbbell","Dumbbell"]}}')$q$);
select test_helpers.invalid($q$select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000002','{"id":"72000000-0000-4000-8000-000000000002","kind":"weight","revision":0,"userId":"a0000000-0000-4000-8000-000000000004","data":{"date":"2026-09-06","valueKg":75}}')$q$);
select test_helpers.invalid($q$select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000002','{"id": "72000000-0000-4000-8000-000000000002", "kind": "location", "revision": 0, "data": {"name": "Home", "type": null, "equipment": []}}')$q$);
select test_helpers.invalid($q$select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000002','{"id": "72000000-0000-4000-8000-000000000002", "kind": "weight", "revision": 0, "data": {"date": null, "valueKg": 75}}')$q$);
select test_helpers.invalid($q$select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000002','{"id": "72000000-0000-4000-8000-000000000002", "kind": "event", "revision": 0, "data": {"name": "Trip", "type": "Travel", "details": "", "startDate": null, "endDate": "2026-09-07", "training": "Normal"}}')$q$);
select test_helpers.invalid($q$select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000002','{"id": "72000000-0000-4000-8000-000000000002", "kind": "event", "revision": 0, "data": {"name": "Trip", "type": "Travel", "details": null, "startDate": "2026-09-06", "endDate": "2026-09-07", "training": "Normal"}}')$q$);
select test_helpers.invalid($q$select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000002','{"id": "72000000-0000-4000-8000-000000000002", "kind": "preferences", "revision": 0, "data": {"units": null, "privateProfile": true, "instructions": "Periodic", "tone": "Beep", "countdown": true, "vibration": false}}')$q$);
select test_helpers.conflict($q$select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000002','{"id":"72000000-0000-4000-8000-000000000001","kind":"weight","revision":0,"data":{"date":"2026-09-06","valueKg":76}}')$q$);
select test_helpers.conflict($q$select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000001','{"id":"72000000-0000-4000-8000-000000000001","kind":"weight","revision":1,"data":{"date":"2026-09-06","valueKg":76}}')$q$);
select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000003','{"id":"72000000-0000-4000-8000-000000000001","kind":"weight","revision":1,"data":{"date":"2026-09-06","valueKg":76}}');
select test_helpers.assert((select revision from public.member_records)=2,'Acknowledged edit increments revision');
select test_helpers.set_actor(4);
select test_helpers.assert(public.gymaf_member_query()='[]'::jsonb,'Sibling client cannot read private member records');
select test_helpers.denied($q$select public.gymaf_member_command('member.delete','71000000-0000-4000-8000-000000000004','{"id":"72000000-0000-4000-8000-000000000001","kind":"weight","revision":2}')$q$);
select test_helpers.set_actor(2);
select test_helpers.assert(public.gymaf_member_query()='[]'::jsonb,'Another coach cannot read member records');
select test_helpers.denied($q$select public.gymaf_member_command('member.save','71000000-0000-4000-8000-000000000004','{"id":"72000000-0000-4000-8000-000000000001","kind":"weight","revision":2,"data":{"date":"2026-09-06","valueKg":99}}')$q$);
select test_helpers.set_actor(7);
select public.gymaf_member_command('member.delete','71000000-0000-4000-8000-000000000005','{"id":"72000000-0000-4000-8000-000000000001","kind":"weight","revision":2}');
select public.gymaf_member_command('member.delete','71000000-0000-4000-8000-000000000005','{"id":"72000000-0000-4000-8000-000000000001","kind":"weight","revision":2}');
select test_helpers.assert(public.gymaf_member_query()='[]'::jsonb,'Delete and delete retry remain acknowledged');
-- Exercise every record kind, not just the weight path used by ownership tests.
do $$
declare sample jsonb; ident uuid; result jsonb;
begin
  for sample in select value from jsonb_array_elements('[
    {"kind":"preferences","data":{"units":"Metric","privateProfile":true,"instructions":"Periodic","tone":"Beep","countdown":true,"vibration":true}},
    {"kind":"location","data":{"name":"Test Gym","type":"Gym","equipment":["Dumbbell"]}},
    {"kind":"injury","data":{"description":"Synthetic limitation","affectsMovement":true,"excluded":["Squat"]}},
    {"kind":"event","data":{"name":"Synthetic trip","type":"Travel","details":"Test details","startDate":"2026-09-06","endDate":"2026-09-07","training":"Normal"}},
    {"kind":"weight-target","data":{"valueKg":72}}
  ]'::jsonb) loop
    ident:=gen_random_uuid();
    result:=public.gymaf_member_command('member.save',gen_random_uuid(),jsonb_build_object('id',ident,'kind',sample->>'kind','revision',0,'data',sample->'data'));
    perform test_helpers.assert((result->>'revision')::int=1,'Each kind creates successfully');
    perform test_helpers.assert(exists(select 1 from public.member_records where id=ident and data=sample->'data'),'Each kind persists exact data');
    result:=public.gymaf_member_command('member.save',gen_random_uuid(),jsonb_build_object('id',ident,'kind',sample->>'kind','revision',1,'data',sample->'data'));
    perform test_helpers.assert((result->>'revision')::int=2,'Each kind supports revisioned edits');
    if sample->>'kind'<>'preferences' then
      perform public.gymaf_member_command('member.delete',gen_random_uuid(),jsonb_build_object('id',ident,'kind',sample->>'kind','revision',2));
      perform test_helpers.assert(not exists(select 1 from public.member_records where id=ident),'Each deletable kind is removed');
    end if;
  end loop;
end $$;
select test_helpers.assert(jsonb_array_length(public.gymaf_member_query())=1,'Only singleton preferences remain');
reset role;
set local role anon;
do $$ begin
  begin perform public.gymaf_member_query(); exception when insufficient_privilege then return; end;
  raise exception 'Anonymous member access allowed';
end $$;
reset role;
rollback;
select 'PASS: member records persistence, validation, revisions, retry, sibling/coach/anonymous denial' as result;
