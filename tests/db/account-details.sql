\set ON_ERROR_STOP on
begin;
insert into auth.users values('a0000000-0000-4000-8000-000000000007','account-test@gymaf.example',now());
insert into auth.sessions values('b0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000007');
create function test_helpers.account_invalid(statement text) returns void language plpgsql security invoker as $$
begin begin execute statement;exception when sqlstate '22023' or sqlstate '22P02' or sqlstate '22003' then return;end;raise exception 'Expected validation denial';end $$;
grant execute on function test_helpers.account_invalid(text) to authenticated;
set local role authenticated;
select test_helpers.set_actor(7);
select test_helpers.assert(public.gymaf_interests_query()='[]'::jsonb,'Interests start empty');
do $$
declare p jsonb; rev integer;
begin
 select revision into rev from public.app_users where id=auth.uid();
 p:=jsonb_build_object('displayName','Synthetic interests','locale','en','timezone','Europe/Sofia','goal','','equipment','','availability','','revision',rev,'interests',jsonb_build_array('running','Trail-walking'));
 perform public.gymaf_command('profile.save','81000000-0000-4000-8000-000000000001',p);
 perform public.gymaf_command('profile.save','81000000-0000-4000-8000-000000000001',p);
 perform test_helpers.assert(public.gymaf_interests_query()='["running","Trail-walking"]'::jsonb,'Interests save and unchanged retry');
 perform test_helpers.conflict(format('select public.gymaf_command(''profile.save'',''81000000-0000-4000-8000-000000000002'',%L)',p));
 p:=jsonb_set(p,'{revision}',to_jsonb(rev+1));
 p:=jsonb_set(p,'{interests}','["running","RUNNING"]');
 begin
   perform public.gymaf_command('profile.save','81000000-0000-4000-8000-000000000003',p);
   raise exception 'Expected invalid interest';
 exception when sqlstate '22023' then null;end;
 perform test_helpers.assert((select revision=rev+1 from public.app_users where id=auth.uid()),'Invalid interests roll back profile revision');
 perform public.gymaf_command('profile.save','81000000-0000-4000-8000-000000000004',p-'interests');
 perform test_helpers.assert(public.gymaf_interests_query()='["running","Trail-walking"]'::jsonb,'Old clients preserve interests');
end $$;
select public.gymaf_member_command('member.save','81000000-0000-4000-8000-000000000005','{"id":"82000000-0000-4000-8000-000000000001","kind":"account","revision":0,"data":{"preferredName":"Synthetic","firstName":"Test","lastName":"Account","biologicalSex":"Prefer not to say","dateOfBirth":"1998-02-18","heightCm":"172.5","phone":"+359 888 123 456"}}');
select public.gymaf_member_command('member.save','81000000-0000-4000-8000-000000000005','{"id":"82000000-0000-4000-8000-000000000001","kind":"account","revision":0,"data":{"preferredName":"Synthetic","firstName":"Test","lastName":"Account","biologicalSex":"Prefer not to say","dateOfBirth":"1998-02-18","heightCm":"172.5","phone":"+359 888 123 456"}}');
select test_helpers.assert((select count(*)=1 from public.member_records where kind='account'),'Account retry is a singleton');
select test_helpers.denied($q$update public.profile_interests set interests='[]'$q$);
select test_helpers.denied($q$update public.member_records set data='{}' where kind='account'$q$);
do $$
declare payload jsonb; invalid jsonb;
begin
 select jsonb_build_object('id',id,'kind',kind,'revision',revision,'data',data) into payload from public.member_records where kind='account';
 for invalid in select value from jsonb_array_elements('[{"heightCm":"20"},{"dateOfBirth":"2026-02-31"},{"dateOfBirth":"2099-01-01"},{"phone":"not a number"},{"firstName":null},{"email":"forged@example.com"}]'::jsonb) loop
  perform test_helpers.account_invalid(format('select public.gymaf_member_command(''member.save'',''81000000-0000-4000-8000-000000000007'',%L)',jsonb_set(payload,'{data}',(payload->'data')||invalid)));
 end loop;
 perform test_helpers.account_invalid(format('select public.gymaf_member_command(''member.save'',''81000000-0000-4000-8000-000000000007'',%L)',payload||jsonb_build_object('userId',auth.uid())));
 perform test_helpers.conflict(format('select public.gymaf_member_command(''member.save'',''81000000-0000-4000-8000-000000000007'',%L)',jsonb_set(payload,'{revision}','0')));
 perform test_helpers.conflict(format('select public.gymaf_member_command(''member.save'',''81000000-0000-4000-8000-000000000007'',%L)',payload||'{"id":"82000000-0000-4000-8000-000000000002","revision":0}'::jsonb));
end $$;
select test_helpers.set_actor(4);
select test_helpers.assert(public.gymaf_interests_query()='[]'::jsonb,'Sibling client cannot read interests');
select test_helpers.assert(not exists(select 1 from public.member_records where kind='account'),'Sibling client cannot read account');
select test_helpers.denied($q$select public.gymaf_member_command('member.save','81000000-0000-4000-8000-000000000006','{"id":"82000000-0000-4000-8000-000000000001","kind":"account","revision":1,"data":{"preferredName":"","firstName":"","lastName":"","biologicalSex":"","dateOfBirth":"","heightCm":"","phone":""}}')$q$);
select test_helpers.set_actor(1);
select test_helpers.assert(public.gymaf_interests_query()='[]'::jsonb,'Assigned coach cannot read private interests');
select test_helpers.assert(not exists(select 1 from public.member_records where kind='account'),'Assigned coach cannot read personal account');
select test_helpers.set_actor(2);
select test_helpers.assert(public.gymaf_interests_query()='[]'::jsonb,'Other coach cannot read private interests');
select test_helpers.assert(not exists(select 1 from public.member_records where kind='account'),'Other coach cannot read personal account');
reset role;
set local role anon;
do $$ begin begin perform public.gymaf_interests_query();raise exception 'Anonymous query allowed';exception when insufficient_privilege then null;end;end $$;
rollback;
