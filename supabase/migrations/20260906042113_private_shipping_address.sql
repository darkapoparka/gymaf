begin;
alter table public.member_records drop constraint member_records_kind_check;
alter table public.member_records add constraint member_records_kind_check check(kind in ('preferences','location','injury','event','weight','weight-target','account','shipping'));
create unique index member_records_shipping_singleton on public.member_records(user_id) where kind='shipping';
alter function gymaf_private.member_data_valid(text,jsonb) rename to member_data_valid_before_shipping;
create function gymaf_private.member_data_valid(k text,d jsonb) returns boolean language plpgsql stable set search_path='' as $$
declare key text; allowed text[]:=array['street','apartment','city','region','postalCode','country','shirtSize']; is_us boolean;
begin
 if k<>'shipping' then return gymaf_private.member_data_valid_before_shipping(k,d);end if;
 if jsonb_typeof(d) is distinct from 'object' or not(d ?& allowed) or (d-allowed)<>'{}'::jsonb then return false;end if;
 foreach key in array allowed loop
  if jsonb_typeof(d->key) is distinct from 'string' then return false;end if;
 end loop;
 if length(btrim(d->>'street')) not between 1 and 200 or length(d->>'apartment')>120 or length(btrim(d->>'city')) not between 1 and 120 or length(d->>'region')>120 or length(d->>'postalCode')>20 or length(btrim(d->>'country')) not between 2 and 80 or d->>'shirtSize' not in ('XS','S','M','L','XL','XXL') then return false;end if;
 is_us:=lower(btrim(d->>'country')) in ('united states','united states of america','us','usa');
 if is_us and (d->>'region' not in ('AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY') or d->>'postalCode' !~ '^\d{5}(-\d{4})?$') then return false;end if;
 return true;
end $$;
revoke all on function gymaf_private.member_data_valid(text,jsonb) from public,anon,authenticated;
do $$
declare original text; revised text;
begin
 original:=pg_get_functiondef('public.gymaf_member_command(text,uuid,jsonb)'::regprocedure);
 revised:=replace(original,$old$k not in ('preferences','location','injury','event','weight','weight-target','account')$old$,$new$k not in ('preferences','location','injury','event','weight','weight-target','account','shipping')$new$);
 if revised=original then raise exception 'Member command anchor missing';end if;
 execute revised;
end $$;
commit;
