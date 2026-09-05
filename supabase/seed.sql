-- LOCAL SYNTHETIC DEVELOPMENT ONLY. Never include this seed in a production release.
-- scripts/astra-local.mjs refuses non-loopback endpoints before invoking this function.
create or replace function public.gymaf_seed_synthetic(coach_a uuid,coach_b uuid,client_a1 uuid,client_a2 uuid,client_b1 uuid,operator_user uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare wa uuid:='10000000-0000-4000-8000-000000000001'; wb uuid:='10000000-0000-4000-8000-000000000002';
  ra1 uuid:='20000000-0000-4000-8000-000000000001'; ra2 uuid:='20000000-0000-4000-8000-000000000002'; rb1 uuid:='20000000-0000-4000-8000-000000000003';
  who uuid; label text;
begin
  if auth.role()<>'service_role' then raise exception 'Local seed requires service role' using errcode='42501'; end if;
  -- No metadata-based role assignment. This helper exists only in local seed.sql.
  for who,label in select * from (values (coach_a,'Test coach A'),(coach_b,'Test coach B'),(client_a1,'Test client A1'),(client_a2,'Test client A2'),(client_b1,'Test client B1'),(operator_user,'Local operator')) as names(id,name) loop
    insert into public.app_users(id,display_name,locale) values(who,label,'en') on conflict(id) do update set display_name=excluded.display_name;
  end loop;
  update gymaf_private.runtime set synthetic_local=true where singleton;
  insert into gymaf_private.operators(user_id) values(operator_user) on conflict do nothing;
  insert into public.workspaces(id,name,slug,public_name) values(wa,'Synthetic coaching A','test-coach-a','Test coach A'),(wb,'Synthetic coaching B','test-coach-b','Test coach B') on conflict(id) do nothing;
  insert into public.workspace_memberships(workspace_id,user_id,role) values(wa,coach_a,'owner'),(wb,coach_b,'owner') on conflict do nothing;
  insert into public.coaching_relationships(id,workspace_id,client_user_id,coach_user_id) values(ra1,wa,client_a1,coach_a),(ra2,wa,client_a2,coach_a),(rb1,wb,client_b1,coach_b) on conflict(id) do nothing;
  insert into public.service_entitlements(id,workspace_id,relationship_id,source,starts_at,ends_at) values
    ('30000000-0000-4000-8000-000000000001',wa,ra1,'complimentary',now()-interval '1 day',now()+interval '30 days'),
    ('30000000-0000-4000-8000-000000000002',wa,ra2,'complimentary',now()-interval '1 day',now()+interval '30 days'),
    ('30000000-0000-4000-8000-000000000003',wb,rb1,'complimentary',now()-interval '1 day',now()+interval '30 days') on conflict(id) do nothing;
  return jsonb_build_object('workspaces',jsonb_build_object('a',wa,'b',wb),'relationships',jsonb_build_object('a1',ra1,'a2',ra2,'b1',rb1));
end $$;
revoke all on function public.gymaf_seed_synthetic(uuid,uuid,uuid,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.gymaf_seed_synthetic(uuid,uuid,uuid,uuid,uuid,uuid) to service_role;
