begin;
create table public.coach_time_slots (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
 starts_at timestamptz not null, ends_at timestamptz not null, cancel_minutes integer not null check(cancel_minutes between 0 and 10080),
 state text not null default 'available' check(state in ('available','withdrawn')), created_at timestamptz not null default now(),
 check(ends_at>starts_at and ends_at<=starts_at+interval '4 hours')
);
create index coach_slots_workspace_start on public.coach_time_slots(workspace_id,starts_at);
create table public.coach_appointments (
 id uuid primary key default gen_random_uuid(), slot_id uuid not null references public.coach_time_slots(id),
 member_id uuid not null references public.app_users(id), state text not null default 'booked' check(state in ('booked','canceled')),
 created_at timestamptz not null default now(), canceled_at timestamptz
);
create unique index appointment_slot_reserved on public.coach_appointments(slot_id) where state='booked';
create index appointments_member on public.coach_appointments(member_id,created_at);
alter table public.coach_time_slots enable row level security;
alter table public.coach_appointments enable row level security;
revoke all on public.coach_time_slots,public.coach_appointments from public,anon,authenticated;
grant select on public.coach_time_slots,public.coach_appointments to authenticated;
create policy slots_owner_read on public.coach_time_slots for select to authenticated using(gymaf_private.is_owner(workspace_id));
create policy appointment_member_read on public.coach_appointments for select to authenticated using(member_id=gymaf_private.active_actor());

create function public.gymaf_booking_query(p_workspace uuid default null,p_owner boolean default false) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); coach_name text; slots jsonb; appointments jsonb;
begin
 if actor is null then raise exception 'Invalid application session' using errcode='28000';end if;
 if p_owner and (p_workspace is null or not gymaf_private.is_owner(p_workspace)) then raise exception 'Workspace unavailable' using errcode='42501';end if;
 if p_workspace is not null then
  select w.public_name into coach_name from public.workspaces w where w.id=p_workspace and w.status='active' and (p_owner or (w.published and exists(select 1 from public.coach_directory_profiles d where d.workspace_id=w.id and d.data->'listed'='true'::jsonb)) or exists(select 1 from public.coaching_relationships r where r.workspace_id=w.id and r.client_user_id=actor and r.state in ('active','paused')));
  if not found then raise exception 'Coach unavailable' using errcode='42501';end if;
 end if;
 select coalesce(jsonb_agg(q.item order by q.starts_at),'[]'::jsonb) into slots from (
  select s.starts_at,jsonb_build_object('id',s.id,'workspaceId',s.workspace_id,'startsAt',s.starts_at,'endsAt',s.ends_at,'cancelMinutes',s.cancel_minutes,'state',s.state,'reserved',exists(select 1 from public.coach_appointments a where a.slot_id=s.id and a.state='booked')) as item
  from public.coach_time_slots s where s.workspace_id=p_workspace and s.starts_at>now() and (p_owner or (s.state='available' and not exists(select 1 from public.coach_appointments a where a.slot_id=s.id and a.state='booked'))) order by s.starts_at limit 500
 ) q;
 select coalesce(jsonb_agg(q.item order by q.starts_at),'[]'::jsonb) into appointments from (
  select s.starts_at,jsonb_build_object('id',a.id,'slotId',s.id,'workspaceId',s.workspace_id,'coachName',w.public_name,'memberName',case when p_owner then pr.display_name else null end,'startsAt',s.starts_at,'endsAt',s.ends_at,'cancelMinutes',s.cancel_minutes,'state',a.state,'canCancel',a.state='booked' and (p_owner or now()<s.starts_at-make_interval(mins=>s.cancel_minutes))) as item
  from public.coach_appointments a join public.coach_time_slots s on s.id=a.slot_id join public.workspaces w on w.id=s.workspace_id join public.app_users pr on pr.id=a.member_id
  where (case when p_owner then s.workspace_id=p_workspace else a.member_id=actor end) and (p_workspace is null or s.workspace_id=p_workspace) order by s.starts_at desc limit 500
 ) q;
 return jsonb_build_object('coachName',coach_name,'slots',slots,'appointments',appointments);
end $$;
revoke all on function public.gymaf_booking_query(uuid,boolean) from public,anon;
grant execute on function public.gymaf_booking_query(uuid,boolean) to authenticated;

create function public.gymaf_booking_command(p_action text,p_command_id uuid,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); ident uuid; wid uuid; s public.coach_time_slots; a public.coach_appointments; previous gymaf_private.commands; fingerprint text; result jsonb; first_at timestamptz; last_at timestamptz; cancel_mins integer;
begin
 if actor is null then raise exception 'Invalid application session' using errcode='28000';end if;
 if p_command_id is null or jsonb_typeof(p) is distinct from 'object' then raise exception 'Invalid booking command' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,771));
 if p_action='booking.slot-create' then
  if not(p ?& array['workspaceId','startsAt','endsAt','cancelMinutes']) or (p-array['workspaceId','startsAt','endsAt','cancelMinutes'])<>'{}'::jsonb or jsonb_typeof(p->'cancelMinutes') is distinct from 'number' or p->>'cancelMinutes' !~ '^\d+$' or p->>'startsAt' !~ '(Z|[+-]\d{2}:\d{2})$' or p->>'endsAt' !~ '(Z|[+-]\d{2}:\d{2})$' then raise exception 'Invalid time slot' using errcode='22023';end if;
  wid:=(p->>'workspaceId')::uuid;
  if not gymaf_private.is_owner(wid) then raise exception 'Workspace unavailable' using errcode='42501';end if;
  first_at:=(p->>'startsAt')::timestamptz;last_at:=(p->>'endsAt')::timestamptz;cancel_mins:=(p->>'cancelMinutes')::integer;
  if first_at is null or last_at is null or not isfinite(first_at) or not isfinite(last_at) or last_at<=first_at or last_at>first_at+interval '4 hours' or cancel_mins not between 0 and 10080 then raise exception 'Invalid time slot' using errcode='22023';end if;
 elsif p_action in ('booking.reserve','booking.withdraw','booking.cancel') then
  if not(p ? 'id') or (p-'id')<>'{}'::jsonb then raise exception 'Invalid booking command' using errcode='22023';end if;
  ident:=(p->>'id')::uuid;
  if p_action='booking.cancel' then
   select * into a from public.coach_appointments where id=ident;
   select * into s from public.coach_time_slots where id=a.slot_id;
   if a.id is null or (a.member_id<>actor and not gymaf_private.is_owner(s.workspace_id)) then raise exception 'Appointment unavailable' using errcode='42501';end if;
  else
   select * into s from public.coach_time_slots where id=ident;
   if s.id is null then raise exception 'Time slot unavailable' using errcode='42501';end if;
   if p_action='booking.withdraw' and not gymaf_private.is_owner(s.workspace_id) then raise exception 'Workspace unavailable' using errcode='42501';end if;
   if p_action='booking.reserve' then perform public.gymaf_booking_query(s.workspace_id,false);end if;
  end if;
  wid:=s.workspace_id;
 else raise exception 'Unknown booking command' using errcode='22023';end if;
 -- Serialize all slot changes for a coach. Actor lock also prevents cross-coach double booking.
 perform 1 from public.workspaces where id=wid and status='active' for update;
 if not found then raise exception 'Workspace unavailable' using errcode='42501';end if;
 fingerprint:=encode(extensions.digest(p_action||p::text,'sha256'),'hex');
 select * into previous from gymaf_private.commands where actor_id=actor and command_id=p_command_id;
 if found then if previous.action<>p_action or previous.request_hash<>fingerprint then raise exception 'Idempotency conflict' using errcode='GY409';end if;return previous.result;end if;
 if p_action='booking.slot-create' then
  if first_at<=now() or first_at>now()+interval '1 year' then raise exception 'Choose a future time within one year' using errcode='22023';end if;
  if exists(select 1 from public.coach_time_slots where workspace_id=wid and state='available' and starts_at<last_at and ends_at>first_at) then raise exception 'Time slot overlaps existing availability' using errcode='GY409';end if;
  insert into public.coach_time_slots(workspace_id,starts_at,ends_at,cancel_minutes)values(wid,first_at,last_at,cancel_mins)returning id into ident;
 elsif p_action='booking.reserve' then
  select * into s from public.coach_time_slots where id=ident for update;
  if s.state<>'available' or s.starts_at<=now() or exists(select 1 from public.coach_appointments where slot_id=s.id and state='booked') then raise exception 'This time is no longer available. Refresh available times.' using errcode='GY409';end if;
  if exists(select 1 from public.coach_appointments b join public.coach_time_slots t on t.id=b.slot_id where b.member_id=actor and b.state='booked' and t.starts_at<s.ends_at and t.ends_at>s.starts_at) then raise exception 'You already have an appointment at this time' using errcode='GY409';end if;
  insert into public.coach_appointments(slot_id,member_id)values(s.id,actor)returning id into ident;
 elsif p_action='booking.withdraw' then
  if exists(select 1 from public.coach_appointments where slot_id=ident and state='booked') then raise exception 'Cancel the booked appointment before withdrawing this slot' using errcode='GY409';end if;
  update public.coach_time_slots set state='withdrawn' where id=ident;
 else
  select * into a from public.coach_appointments where id=ident for update;
  if a.state='booked' and not gymaf_private.is_owner(wid) and now()>=s.starts_at-make_interval(mins=>s.cancel_minutes) then raise exception 'The cancellation deadline has passed. Contact your coach.' using errcode='42501';end if;
  update public.coach_appointments set state='canceled',canceled_at=coalesce(canceled_at,now()) where id=ident;
 end if;
 result:=jsonb_build_object('id',ident);
 insert into gymaf_private.commands(actor_id,command_id,action,request_hash,result)values(actor,p_command_id,p_action,fingerprint,result);
 insert into gymaf_private.audit_events(actor_id,action,resource_id,command_id)values(actor,p_action,ident,p_command_id);
 return result;
end $$;
revoke all on function public.gymaf_booking_command(text,uuid,jsonb) from public,anon;
grant execute on function public.gymaf_booking_command(text,uuid,jsonb) to authenticated;
commit;
