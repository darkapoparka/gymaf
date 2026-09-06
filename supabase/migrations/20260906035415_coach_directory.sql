begin;
create function gymaf_private.directory_data_valid(d jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare key text; allowed text[]; value jsonb;
begin
 if jsonb_typeof(d) is distinct from 'object' or octet_length(d::text)>8000 or not(d ?& array['listed','expertise','styles','sports','languages','experience','qualifications','loves','location']) or (d-array['listed','expertise','styles','sports','languages','experience','qualifications','loves','location'])<>'{}'::jsonb or jsonb_typeof(d->'listed') is distinct from 'boolean' then return false;end if;
 foreach key in array array['experience','qualifications','loves','location'] loop
  if jsonb_typeof(d->key) is distinct from 'string' or length(d->>key)>(case key when 'qualifications' then 1000 when 'location' then 120 else 500 end) then return false;end if;
 end loop;
 foreach key in array array['expertise','styles','sports','languages'] loop
  allowed:=case key
   when 'expertise' then array['Sports Performance','General Strength Training','Nutrition','Bodybuilding','Weight Loss','Adaptive Exercise','Orthopedic Limitations','Injury Prevention','Tactical Performance','Sports Psychology','Olympic Weightlifting','Powerlifting','Running','Kettlebells','Prenatal and Postpartum','Hiking','Crossfit','Combat Sports','Triathlon','Metabolic Syndromes and Heart Conditions','Yoga','Cycling','Swimming','Gymnastics','Rowing','Pilates and Barre','Dance','Obstacle Races']
   when 'styles' then array['Detail Oriented','Even Keeled','High Energy','Laid Back','Motivating','Results Oriented','Supportive']
   when 'sports' then array['Basketball','Football','Soccer','Baseball','Group Fitness and Bootcamps','Running','Cycling','Swimming','Tennis','Hiking']
   else array['English','Bulgarian','Spanish','French','German','Italian','Portuguese'] end;
  if jsonb_typeof(d->key) is distinct from 'array' or jsonb_array_length(d->key)>cardinality(allowed) then return false;end if;
  for value in select * from jsonb_array_elements(d->key) loop
   if jsonb_typeof(value) is distinct from 'string' or not(value#>>'{}'=any(allowed)) then return false;end if;
  end loop;
  if jsonb_array_length(d->key)<>(select count(distinct v) from jsonb_array_elements(d->key)v) then return false;end if;
 end loop;
 return true;
end $$;
revoke all on function gymaf_private.directory_data_valid(jsonb) from public,anon,authenticated;
create table public.coach_directory_profiles(
 workspace_id uuid primary key references public.workspaces(id) on delete cascade,
 data jsonb not null check(gymaf_private.directory_data_valid(data)),
 revision integer not null check(revision>0),updated_at timestamptz not null default now()
);
alter table public.coach_directory_profiles enable row level security;
revoke all on public.coach_directory_profiles from public,anon,authenticated;
grant select on public.coach_directory_profiles to authenticated;
create policy directory_owner_read on public.coach_directory_profiles for select to authenticated using(gymaf_private.is_owner(workspace_id));
create function public.gymaf_directory_query(p_workspace uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare item public.coach_directory_profiles; published boolean;
begin
 if p_workspace is not null then
  if gymaf_private.active_actor() is null or not gymaf_private.is_owner(p_workspace) then raise exception 'Workspace unavailable' using errcode='42501';end if;
  select w.published into published from public.workspaces w where id=p_workspace and status='active';
  if not found then raise exception 'Workspace unavailable' using errcode='42501';end if;
  select * into item from public.coach_directory_profiles where workspace_id=p_workspace;
  return jsonb_build_object('workspaceId',p_workspace,'revision',coalesce(item.revision,0),'workspacePublished',published,'data',coalesce(item.data,'{"listed":false,"expertise":[],"styles":[],"sports":[],"languages":[],"experience":"","qualifications":"","loves":"","location":""}'::jsonb));
 end if;
 -- Only explicit directory opt-ins with an active published workspace are public.
 return jsonb_build_object('coaches',coalesce((select jsonb_agg(c.value order by c.name,c.slug) from (
  select w.public_name as name,w.slug,jsonb_build_object('workspaceId',w.id,'slug',w.slug,'name',w.public_name,'bio',w.bio,'details',d.data-'listed') as value
  from public.workspaces w join public.coach_directory_profiles d on d.workspace_id=w.id
  where w.published and w.status='active' and d.data->'listed'='true'::jsonb order by w.public_name,w.slug limit 500
 ) c),'[]'::jsonb),'hasMore',(select count(*)>500 from public.workspaces w join public.coach_directory_profiles d on d.workspace_id=w.id where w.published and w.status='active' and d.data->'listed'='true'::jsonb));
end $$;
revoke all on function public.gymaf_directory_query(uuid) from public;
grant execute on function public.gymaf_directory_query(uuid) to anon,authenticated;
create function public.gymaf_directory_command(p_action text,p_command_id uuid,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); ident uuid; rev integer; item public.coach_directory_profiles; previous gymaf_private.commands; fingerprint text; result jsonb;
begin
 if actor is null then raise exception 'Invalid application session' using errcode='28000';end if;
 if p_action is distinct from 'directory.save' or p_command_id is null or jsonb_typeof(p) is distinct from 'object' or not(p ?& array['workspaceId','revision','data']) or (p-array['workspaceId','revision','data'])<>'{}'::jsonb or jsonb_typeof(p->'workspaceId') is distinct from 'string' or jsonb_typeof(p->'revision') is distinct from 'number' or p->>'revision' !~ '^\d+$' or not coalesce(gymaf_private.directory_data_valid(p->'data'),false) then raise exception 'Invalid directory profile' using errcode='22023';end if;
 ident:=(p->>'workspaceId')::uuid;rev:=(p->>'revision')::integer;
 if rev>2147483646 then raise exception 'Invalid revision' using errcode='22023';end if;
 if not gymaf_private.is_owner(ident) then raise exception 'Workspace unavailable' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,771));
 perform 1 from public.workspaces where id=ident and status='active' for update;
 if not found then raise exception 'Workspace unavailable' using errcode='42501';end if;
 fingerprint:=encode(extensions.digest(p_action||p::text,'sha256'),'hex');
 select * into previous from gymaf_private.commands where actor_id=actor and command_id=p_command_id;
 if found then
  if previous.action<>p_action or previous.request_hash<>fingerprint then raise exception 'Idempotency conflict' using errcode='GY409';end if;
  return previous.result;
 end if;
 select * into item from public.coach_directory_profiles where workspace_id=ident for update;
 if coalesce(item.revision,0)<>rev then raise exception 'Directory profile changed' using errcode='GY409';end if;
 insert into public.coach_directory_profiles(workspace_id,data,revision)values(ident,p->'data',rev+1) on conflict(workspace_id)do update set data=excluded.data,revision=excluded.revision,updated_at=now();
 result:=jsonb_build_object('id',ident,'revision',rev+1);
 insert into gymaf_private.commands(actor_id,command_id,action,request_hash,result)values(actor,p_command_id,p_action,fingerprint,result);
 insert into gymaf_private.audit_events(actor_id,action,resource_id,command_id)values(actor,p_action,ident,p_command_id);
 return result;
end $$;
revoke all on function public.gymaf_directory_command(text,uuid,jsonb) from public,anon;
grant execute on function public.gymaf_directory_command(text,uuid,jsonb) to authenticated;
create function public.gymaf_directory_export() returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('workspaceId',workspace_id,'data',data,'revision',revision,'updatedAt',updated_at) order by workspace_id),'[]'::jsonb) from public.coach_directory_profiles
$$;
revoke all on function public.gymaf_directory_export() from public,anon;
grant execute on function public.gymaf_directory_export() to authenticated;
commit;
