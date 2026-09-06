begin;
-- Private account records for the connected frontend. No implicit coach sharing.
create table public.member_records (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  kind text not null check(kind in ('preferences','location','injury','event','weight','weight-target')),
  data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=20000),
  revision integer not null default 1 check(revision>0),
  updated_at timestamptz not null default now()
);
create index member_records_user on public.member_records(user_id,kind);
create unique index member_records_singleton on public.member_records(user_id,kind) where kind in ('preferences','weight-target');
alter table public.member_records enable row level security;
revoke all on public.member_records from public,anon,authenticated;
grant select on public.member_records to authenticated;
create policy member_records_read on public.member_records for select to authenticated
  using(user_id=gymaf_private.active_actor());

create function gymaf_private.member_data_valid(k text,d jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare allowed text[]; required text[]; field text; item jsonb;
begin
  if jsonb_typeof(d) is distinct from 'object' or octet_length(d::text)>20000 then return false; end if;
  case k
    when 'preferences' then allowed:=array['units','privateProfile','instructions','tone','countdown','vibration'];
    when 'location' then allowed:=array['name','type','equipment'];
    when 'injury' then allowed:=array['description','affectsMovement','excluded'];
    when 'event' then allowed:=array['name','type','details','startDate','endDate','training'];
    when 'weight' then allowed:=array['date','valueKg'];
    when 'weight-target' then allowed:=array['valueKg'];
    else return false;
  end case;
  required:=allowed;
  if not (d ?& required) or exists(select 1 from jsonb_object_keys(d) key where not(key=any(allowed))) then return false; end if;
  if k='preferences' then
    return d->>'units' in ('Metric','Imperial') and d->>'instructions' in ('Never','Periodic','Every Time') and d->>'tone' in ('Marimba','Beep')
      and jsonb_typeof(d->'privateProfile')='boolean' and jsonb_typeof(d->'countdown')='boolean' and jsonb_typeof(d->'vibration')='boolean';
  elsif k in ('location','event') then
    if jsonb_typeof(d->'name')<>'string' or length(btrim(d->>'name')) not between 1 and 120 then return false; end if;
    if k='location' and coalesce(d->>'type','') not in ('Home','Gym','Outdoor','Somewhere Else') then return false; end if;
    if k='event' then
      if jsonb_typeof(d->'details') is distinct from 'string' or length(d->>'details')>2000 then return false; end if;
      if coalesce(d->>'type','') not in ('Travel','Event') or coalesce(d->>'training','') not in ('Normal','Lighter','No Workouts') then return false; end if;
      foreach field in array array['startDate','endDate'] loop
        if jsonb_typeof(d->field) is distinct from 'string' or d->>field !~ '^\d{4}-\d{2}-\d{2}$' or (d->>field)::date::text<>d->>field then return false; end if;
      end loop;
      return (d->>'endDate')::date >= (d->>'startDate')::date;
    end if;
  elsif k='injury' then
    if jsonb_typeof(d->'description')<>'string' or length(btrim(d->>'description')) not between 1 and 500 or jsonb_typeof(d->'affectsMovement')<>'boolean' then return false; end if;
  elsif k in ('weight','weight-target') then
    if jsonb_typeof(d->'valueKg')<>'number' or (d->>'valueKg')::numeric not between 20 and 500 then return false; end if;
    if k='weight' and (jsonb_typeof(d->'date') is distinct from 'string' or d->>'date' !~ '^\d{4}-\d{2}-\d{2}$' or (d->>'date')::date::text<>d->>'date') then return false; end if;
    return true;
  end if;
  field:=case when k='location' then 'equipment' else 'excluded' end;
  if jsonb_typeof(d->field)<>'array' or jsonb_array_length(d->field)>(case when k='location' then 100 else 60 end) then return false; end if;
  for item in select value from jsonb_array_elements(d->field) loop
    if jsonb_typeof(item)<>'string' or length(btrim(item#>>'{}')) not between 1 and 120 then return false; end if;
  end loop;
  return jsonb_array_length(d->field)=(select count(distinct value) from jsonb_array_elements(d->field));
exception when others then return false;
end $$;
revoke all on function gymaf_private.member_data_valid(text,jsonb) from public,anon,authenticated;

create function public.gymaf_member_query() returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
  if gymaf_private.active_actor() is null then raise exception 'Invalid application session' using errcode='28000'; end if;
  return coalesce((select jsonb_agg(to_jsonb(r)-'user_id' order by r.updated_at desc,r.id) from public.member_records r),'[]'::jsonb);
end $$;
revoke all on function public.gymaf_member_query() from public,anon;
grant execute on function public.gymaf_member_query() to authenticated;

create function public.gymaf_member_command(p_action text,p_command_id uuid,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); item public.member_records; previous gymaf_private.commands;
  ident uuid; rev integer; k text; fingerprint text; result jsonb; fields text[];
begin
  if actor is null then raise exception 'Invalid application session' using errcode='28000'; end if;
  if p_command_id is null or p_action is null or p_action not in ('member.save','member.delete') or jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>24000 then raise exception 'Invalid command' using errcode='22023'; end if;
  fields:=case when p_action='member.save' then array['id','kind','revision','data'] else array['id','kind','revision'] end;
  if not(p ?& fields) or exists(select 1 from jsonb_object_keys(p) key where not(key=any(fields))) then raise exception 'Invalid fields' using errcode='22023'; end if;
  ident:=(p->>'id')::uuid; k:=p->>'kind';
  if ident is null or k is null or k not in ('preferences','location','injury','event','weight','weight-target') or jsonb_typeof(p->'revision') is distinct from 'number' or p->>'revision' !~ '^\d+$' then raise exception 'Invalid record' using errcode='22023'; end if;
  rev:=(p->>'revision')::integer;
  if rev<0 or rev>2147483646 or (p_action='member.delete' and k='preferences') then raise exception 'Invalid revision or deletion' using errcode='22023'; end if;
  if p_action='member.save' and not coalesce(gymaf_private.member_data_valid(k,p->'data'),false) then raise exception 'Invalid record data' using errcode='22023'; end if;
  -- Serialize this actor's edits, including quota/singleton decisions and retries.
  perform pg_advisory_xact_lock(hashtextextended(actor::text,771));
  select * into item from public.member_records where id=ident for update;
  if item.id is not null and (item.user_id<>actor or item.kind<>k) then raise exception 'Unavailable record' using errcode='42501'; end if;
  fingerprint:=encode(extensions.digest(p_action||p::text,'sha256'),'hex');
  select * into previous from gymaf_private.commands where actor_id=actor and command_id=p_command_id;
  if found then
    if previous.request_hash<>fingerprint or previous.action<>p_action then raise exception 'Idempotency conflict' using errcode='40001'; end if;
    return previous.result;
  end if;
  if (item.id is null and rev<>0) or (item.id is not null and item.revision<>rev) then raise exception 'Record changed' using errcode='40001'; end if;
  if p_action='member.delete' then
    if item.id is null then raise exception 'Unavailable record' using errcode='P0002'; end if;
    delete from public.member_records where id=ident and user_id=actor;
  elsif item.id is null then
    if (select count(*) from public.member_records where user_id=actor)>=2000 then raise exception 'Record limit reached' using errcode='22023'; end if;
    insert into public.member_records(id,user_id,kind,data) values(ident,actor,k,p->'data');
  else
    update public.member_records set data=p->'data',revision=revision+1,updated_at=now() where id=ident and user_id=actor;
  end if;
  result:=jsonb_build_object('id',ident,'revision',rev+1);
  insert into gymaf_private.commands(actor_id,command_id,action,request_hash,result) values(actor,p_command_id,p_action,fingerprint,result);
  insert into gymaf_private.audit_events(actor_id,action,resource_id,command_id) values(actor,p_action,ident,p_command_id);
  return result;
end $$;
revoke all on function public.gymaf_member_command(text,uuid,jsonb) from public,anon;
grant execute on function public.gymaf_member_command(text,uuid,jsonb) to authenticated;
commit;
