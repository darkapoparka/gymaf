\set ON_ERROR_STOP on
begin;
create function test_helpers.directory_invalid(statement text) returns void language plpgsql security invoker as $$
begin begin execute statement;exception when sqlstate '22023' or sqlstate '22P02' or sqlstate '22003' then return;end;raise exception 'Expected directory validation denial';end $$;
grant execute on function test_helpers.directory_invalid(text) to authenticated;
select '{"listed":true,"expertise":["Running"],"styles":["Supportive"],"sports":["Running"],"languages":["English"],"experience":"Synthetic experience","qualifications":"Synthetic qualification","loves":"Outdoors","location":"Synthetic city"}'::jsonb as details \gset
select count(*) as relationship_count from public.coaching_relationships \gset
select count(*) as message_count from public.messages \gset
set local role authenticated;
select test_helpers.set_actor(1);
select test_helpers.assert(public.gymaf_directory_query('10000000-0000-4000-8000-000000000001')->>'revision'='0','Unlisted default profile');
select test_helpers.assert(public.gymaf_directory_query('10000000-0000-4000-8000-000000000001')->'data'->>'listed'='false','Directory requires explicit opt-in');
select public.gymaf_directory_command('directory.save','92000000-0000-4000-8000-000000000001',jsonb_build_object('workspaceId','10000000-0000-4000-8000-000000000001','revision',0,'data',:'details'::jsonb));
select public.gymaf_directory_command('directory.save','92000000-0000-4000-8000-000000000001',jsonb_build_object('workspaceId','10000000-0000-4000-8000-000000000001','revision',0,'data',:'details'::jsonb));
select test_helpers.assert(public.gymaf_directory_query('10000000-0000-4000-8000-000000000001')->>'revision'='1','Retry preserves revision');
select test_helpers.assert(jsonb_array_length(public.gymaf_directory_export())=1,'Owner export includes directory metadata');
select test_helpers.conflict(format('select public.gymaf_directory_command(%L,%L,%L::jsonb)','directory.save','92000000-0000-4000-8000-000000000002',jsonb_build_object('workspaceId','10000000-0000-4000-8000-000000000001','revision',0,'data',:'details'::jsonb)::text));
select test_helpers.conflict(format('select public.gymaf_directory_command(%L,%L,%L::jsonb)','directory.save','92000000-0000-4000-8000-000000000001',jsonb_build_object('workspaceId','10000000-0000-4000-8000-000000000001','revision',1,'data',:'details'::jsonb)::text));
select test_helpers.directory_invalid(format('select public.gymaf_directory_command(%L,%L,%L::jsonb)','directory.save','92000000-0000-4000-8000-000000000002',jsonb_build_object('workspaceId','10000000-0000-4000-8000-000000000001','revision',1,'data',:'details'::jsonb||'{"expertise":["Invented"]}')::text));
select test_helpers.directory_invalid(format('select public.gymaf_directory_command(%L,%L,%L::jsonb)','directory.save','92000000-0000-4000-8000-000000000002',jsonb_build_object('workspaceId','10000000-0000-4000-8000-000000000001','revision',1,'data',:'details'::jsonb||'{"styles":["Supportive","Supportive"]}')::text));
select test_helpers.denied('update public.coach_directory_profiles set revision=99');
select test_helpers.set_actor(2);
select test_helpers.denied($q$select public.gymaf_directory_query('10000000-0000-4000-8000-000000000001')$q$);
select test_helpers.assert((select count(*) from public.coach_directory_profiles)=0,'Other owner cannot read private draft');
select test_helpers.assert(public.gymaf_directory_export()='[]'::jsonb,'Other owner export excludes private metadata');
select test_helpers.denied(format('select public.gymaf_directory_command(%L,%L,%L::jsonb)','directory.save','92000000-0000-4000-8000-000000000002',jsonb_build_object('workspaceId','10000000-0000-4000-8000-000000000001','revision',1,'data',:'details'::jsonb)::text));
select test_helpers.set_actor(4);
select test_helpers.denied($q$select public.gymaf_directory_query('10000000-0000-4000-8000-000000000001')$q$);
reset role;
update public.workspaces set published=false where id='10000000-0000-4000-8000-000000000001';
set local role anon;
do $$begin if jsonb_array_length(public.gymaf_directory_query()->'coaches')<>0 then raise exception 'Unpublished profile leaked';end if;end $$;
do $$begin begin perform public.gymaf_directory_query('10000000-0000-4000-8000-000000000001');raise exception 'Anonymous owner query allowed';exception when insufficient_privilege then null;end;end $$;
reset role;
update public.workspaces set published=true where id='10000000-0000-4000-8000-000000000001';
set local role anon;
do $$declare r jsonb:=public.gymaf_directory_query();begin
 if jsonb_array_length(r->'coaches')<>1 then raise exception 'Published opt-in missing';end if;
 if r->'coaches'->0->'details' ? 'listed' or r->'coaches'->0 ? 'revision' then raise exception 'Owner settings leaked';end if;
 if r->'coaches'->0->'details'->>'qualifications'<>'Synthetic qualification' then raise exception 'Authored public details missing';end if;
end $$;
reset role;
update public.workspaces set status='suspended' where id='10000000-0000-4000-8000-000000000001';
select test_helpers.assert(jsonb_array_length(public.gymaf_directory_query()->'coaches')=0,'Suspended workspace hidden');
update public.workspaces set status='active' where id='10000000-0000-4000-8000-000000000001';
set local role authenticated;
select test_helpers.set_actor(1);
select public.gymaf_directory_command('directory.save','92000000-0000-4000-8000-000000000003',jsonb_build_object('workspaceId','10000000-0000-4000-8000-000000000001','revision',1,'data',:'details'::jsonb||'{"listed":false}'));
select test_helpers.assert(jsonb_array_length(public.gymaf_directory_query()->'coaches')=0,'Unlisting immediately removes public result');
reset role;
select test_helpers.assert((select count(*) from public.coaching_relationships)=:relationship_count,'Listing creates no relationship');
select test_helpers.assert((select count(*) from public.messages)=:message_count,'Listing sends no messages');
rollback;
