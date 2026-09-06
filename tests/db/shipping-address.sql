\set ON_ERROR_STOP on
begin;
create function test_helpers.shipping_invalid(statement text) returns void language plpgsql security invoker as $$
begin begin execute statement;exception when sqlstate '22023' then return;end;raise exception 'Expected shipping validation denial';end $$;
grant execute on function test_helpers.shipping_invalid(text) to authenticated;
select '{"street":"Synthetic Way","apartment":"","city":"Synthetic City","region":"CA","postalCode":"00000","country":"United States","shirtSize":"L"}'::jsonb as address \gset
select count(*) as message_count from public.messages \gset
set local role authenticated;
select test_helpers.set_actor(4);
select public.gymaf_member_command('member.save','93000000-0000-4000-8000-000000000011',jsonb_build_object('id','93000000-0000-4000-8000-000000000001','kind','shipping','revision',0,'data',:'address'::jsonb));
select public.gymaf_member_command('member.save','93000000-0000-4000-8000-000000000011',jsonb_build_object('id','93000000-0000-4000-8000-000000000001','kind','shipping','revision',0,'data',:'address'::jsonb));
select test_helpers.assert((select revision from public.member_records where kind='shipping')=1,'Address retry preserves revision');
select test_helpers.assert(exists(select 1 from jsonb_array_elements(public.gymaf_member_query())r where r->>'kind'='shipping' and r->'data'->>'shirtSize'='L'),'Owner export includes saved address preference');
select test_helpers.conflict(format('select public.gymaf_member_command(%L,%L,%L::jsonb)','member.save','93000000-0000-4000-8000-000000000012',jsonb_build_object('id','93000000-0000-4000-8000-000000000002','kind','shipping','revision',0,'data',:'address'::jsonb)::text));
select test_helpers.conflict(format('select public.gymaf_member_command(%L,%L,%L::jsonb)','member.save','93000000-0000-4000-8000-000000000012',jsonb_build_object('id','93000000-0000-4000-8000-000000000001','kind','shipping','revision',0,'data',:'address'::jsonb)::text));
select test_helpers.shipping_invalid(format('select public.gymaf_member_command(%L,%L,%L::jsonb)','member.save','93000000-0000-4000-8000-000000000012',jsonb_build_object('id','93000000-0000-4000-8000-000000000001','kind','shipping','revision',1,'data',:'address'::jsonb||'{"postalCode":"ABCDE"}')::text));
select test_helpers.shipping_invalid(format('select public.gymaf_member_command(%L,%L,%L::jsonb)','member.save','93000000-0000-4000-8000-000000000012',jsonb_build_object('id','93000000-0000-4000-8000-000000000001','kind','shipping','revision',1,'data',:'address'::jsonb||'{"shirtSize":"XXXL"}')::text));
select test_helpers.shipping_invalid(format('select public.gymaf_member_command(%L,%L,%L::jsonb)','member.save','93000000-0000-4000-8000-000000000012',jsonb_build_object('id','93000000-0000-4000-8000-000000000001','kind','shipping','revision',1,'userId','spoof','data',:'address'::jsonb)::text));
select test_helpers.denied('update public.member_records set data=''{}''::jsonb where kind=''shipping''');
select test_helpers.set_actor(1);
select test_helpers.assert((select count(*) from public.member_records where kind='shipping')=0,'Assigned coach cannot read shipping address');
select test_helpers.denied($q$select public.gymaf_member_command('member.delete','93000000-0000-4000-8000-000000000012','{"id":"93000000-0000-4000-8000-000000000001","kind":"shipping","revision":1}')$q$);
select test_helpers.set_actor(2);
select test_helpers.assert((select count(*) from public.member_records where kind='shipping')=0,'Other coach cannot read address');
select test_helpers.set_actor(4);
select public.gymaf_member_command('member.save','93000000-0000-4000-8000-000000000013',jsonb_build_object('id','93000000-0000-4000-8000-000000000001','kind','shipping','revision',1,'data',:'address'::jsonb||'{"country":"Bulgaria","region":"","postalCode":""}'));
select public.gymaf_member_command('member.delete','93000000-0000-4000-8000-000000000014','{"id":"93000000-0000-4000-8000-000000000001","kind":"shipping","revision":2}');
select public.gymaf_member_command('member.delete','93000000-0000-4000-8000-000000000014','{"id":"93000000-0000-4000-8000-000000000001","kind":"shipping","revision":2}');
select test_helpers.assert((select count(*) from public.member_records where kind='shipping')=0,'Removal and lost-ack retry keep address removed');
select public.gymaf_member_command('member.save','93000000-0000-4000-8000-000000000015',jsonb_build_object('id','93000000-0000-4000-8000-000000000002','kind','shipping','revision',0,'data',:'address'::jsonb));
reset role;
select test_helpers.assert((select count(*) from public.messages)=:message_count,'Saving preference sends no message');
rollback;
