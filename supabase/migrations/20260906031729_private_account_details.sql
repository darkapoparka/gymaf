begin;
-- Account fields stay in the existing owner-only record boundary.
alter table public.member_records drop constraint member_records_kind_check;
alter table public.member_records add constraint member_records_kind_check check(kind in ('preferences','location','injury','event','weight','weight-target','account'));
create unique index member_records_account_singleton on public.member_records(user_id) where kind='account';
alter function gymaf_private.member_data_valid(text,jsonb) rename to member_data_valid_before_account;
create function gymaf_private.member_data_valid(k text,d jsonb) returns boolean
language plpgsql stable set search_path='' as $$
declare field text; allowed text[]:=array['preferredName','firstName','lastName','biologicalSex','dateOfBirth','heightCm','phone'];
begin
  if k<>'account' then return gymaf_private.member_data_valid_before_account(k,d); end if;
  if jsonb_typeof(d) is distinct from 'object' or not(d ?& allowed) or exists(select 1 from jsonb_object_keys(d) key where not(key=any(allowed))) then return false; end if;
  foreach field in array allowed loop
    if jsonb_typeof(d->field) is distinct from 'string' then return false; end if;
  end loop;
  foreach field in array array['preferredName','firstName','lastName'] loop
    if length(d->>field)>120 then return false; end if;
  end loop;
  if d->>'biologicalSex' not in ('','Female','Male','Intersex','Prefer not to say') then return false; end if;
  if d->>'dateOfBirth'<>'' and (d->>'dateOfBirth' !~ '^\d{4}-\d{2}-\d{2}$' or (d->>'dateOfBirth')::date::text<>d->>'dateOfBirth' or (d->>'dateOfBirth')::date not between '1900-01-01'::date and current_date) then return false; end if;
  if d->>'heightCm'<>'' and (d->>'heightCm' !~ '^\d+(\.\d)?$' or length(d->>'heightCm')>6 or (d->>'heightCm')::numeric not between 50 and 300) then return false; end if;
  if d->>'phone'<>'' and (length(d->>'phone')>32 or d->>'phone' !~ '^\+?[0-9 ()-]{5,32}$') then return false; end if;
  return true;
exception when others then return false;
end $$;
revoke all on function gymaf_private.member_data_valid(text,jsonb) from public,anon,authenticated;
-- Preserve command authorization, idempotency, revisions and explicit GY409 conflicts.
do $$
declare original text; revised text;
begin
  original:=pg_get_functiondef('public.gymaf_member_command(text,uuid,jsonb)'::regprocedure);
  revised:=replace(original,$old$k not in ('preferences','location','injury','event','weight','weight-target')$old$, $new$k not in ('preferences','location','injury','event','weight','weight-target','account')$new$);
  revised:=replace(revised,$old$p_action='member.delete' and k='preferences'$old$, $new$p_action='member.delete' and k in ('preferences','account')$new$);
  if revised=original then raise exception 'Member command anchor missing'; end if;
  execute revised;
end $$;

create table public.profile_interests (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  interests jsonb not null default '[]'::jsonb
);
alter table public.profile_interests enable row level security;
revoke all on public.profile_interests from public,anon,authenticated;
grant select on public.profile_interests to authenticated;
create policy profile_interests_owner on public.profile_interests for select to authenticated using(user_id=gymaf_private.active_actor());
create function gymaf_private.interests_valid(items jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare item jsonb;
begin
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items)>20 then return false; end if;
  for item in select value from jsonb_array_elements(items) loop
    if jsonb_typeof(item) is distinct from 'string' or length(btrim(item#>>'{}')) not between 1 and 40 or item#>>'{}' !~ '^[-[:alnum:]_ ]+$' then return false; end if;
  end loop;
  return jsonb_array_length(items)=(select count(distinct lower(btrim(value#>>'{}'))) from jsonb_array_elements(items));
end $$;
revoke all on function gymaf_private.interests_valid(jsonb) from public,anon,authenticated;
alter table public.profile_interests add constraint profile_interests_valid check(gymaf_private.interests_valid(interests));
create function public.gymaf_interests_query() returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
  if gymaf_private.active_actor() is null then raise exception 'Invalid application session' using errcode='28000'; end if;
  return coalesce((select interests from public.profile_interests where user_id=gymaf_private.active_actor()),'[]'::jsonb);
end $$;
revoke all on function public.gymaf_interests_query() from public,anon;
grant execute on function public.gymaf_interests_query() to authenticated;
-- Profile revision is the single concurrency boundary for display name and interests.
-- Old clients omitting interests keep the existing private list.
do $migration$
declare original text; revised text; anchor text:='ident:=actor; result:=jsonb_build_object(''id'',ident,''revision'',rev);';
begin
  original:=pg_get_functiondef('public.gymaf_command(text,uuid,jsonb)'::regprocedure);
  revised:=replace(original,anchor,$patch$
      if p ? 'interests' then
        if not gymaf_private.interests_valid(p->'interests') then raise exception 'Invalid interests' using errcode='22023'; end if;
        insert into public.profile_interests(user_id,interests) values(actor,p->'interests') on conflict(user_id) do update set interests=excluded.interests;
      end if;
      ident:=actor; result:=jsonb_build_object('id',ident,'revision',rev);
$patch$);
  if revised=original then raise exception 'Profile command anchor missing'; end if;
  execute revised;
end $migration$;
commit;
