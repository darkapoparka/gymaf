begin;
create table public.coach_ratings (
  relationship_id uuid primary key references public.coaching_relationships(id) on delete cascade,
  rating integer not null check(rating between 1 and 5),
  revision integer not null check(revision>0),
  updated_at timestamptz not null default now()
);
alter table public.coach_ratings enable row level security;
revoke all on public.coach_ratings from public,anon,authenticated;
grant select on public.coach_ratings to authenticated;
create policy coach_ratings_owner on public.coach_ratings for select to authenticated using (
 exists(select 1 from public.coaching_relationships r where r.id=relationship_id and r.client_user_id=gymaf_private.active_actor())
);
create function public.gymaf_coach_rating_query(p_id uuid default null) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); r public.coaching_relationships; f public.coach_ratings;
begin
 if actor is null then raise exception 'Invalid application session' using errcode='28000'; end if;
 if p_id is null then return coalesce((select jsonb_agg(to_jsonb(c)) from public.coach_ratings c),'[]'::jsonb);end if;
 select * into r from public.coaching_relationships where id=p_id;
 if r.id is null or r.client_user_id<>actor then raise exception 'Relationship unavailable' using errcode='42501';end if;
 select * into f from public.coach_ratings where relationship_id=p_id;
 return jsonb_build_object('relationshipId',p_id,'rating',f.rating,'revision',coalesce(f.revision,0),'updatedAt',f.updated_at,
  'canSave',r.state='active' and exists(select 1 from public.workspaces where id=r.workspace_id and status='active'));
end $$;
revoke all on function public.gymaf_coach_rating_query(uuid) from public,anon;
grant execute on function public.gymaf_coach_rating_query(uuid) to authenticated;
create function public.gymaf_coach_rating_command(p_action text,p_command_id uuid,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); r public.coaching_relationships; f public.coach_ratings;
 ident uuid; rev integer; stars integer; fingerprint text; previous gymaf_private.commands; result jsonb;
begin
 if actor is null then raise exception 'Invalid application session' using errcode='28000';end if;
 if p_action is distinct from 'coach-rating.save' or p_command_id is null or jsonb_typeof(p) is distinct from 'object'
  or not(p ?& array['relationshipId','revision','rating']) or (p-array['relationshipId','revision','rating'])<>'{}'::jsonb
  or jsonb_typeof(p->'relationshipId') is distinct from 'string' or jsonb_typeof(p->'revision') is distinct from 'number'
  or p->>'revision' !~ '^\d+$' or jsonb_typeof(p->'rating') is distinct from 'number' or p->>'rating' !~ '^[1-5]$'
 then raise exception 'Invalid rating' using errcode='22023';end if;
 ident:=(p->>'relationshipId')::uuid;rev:=(p->>'revision')::integer;stars:=(p->>'rating')::integer;
 if rev>2147483646 then raise exception 'Invalid revision' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,771));
 -- Match other actor commands' lock order, then lock against relationship ending.
 select * into r from public.coaching_relationships where id=ident for share;
 if r.id is null or r.client_user_id<>actor or r.state<>'active' or not exists(select 1 from public.workspaces where id=r.workspace_id and status='active') then raise exception 'Relationship unavailable' using errcode='42501';end if;
 fingerprint:=encode(extensions.digest(p_action||p::text,'sha256'),'hex');
 select * into previous from gymaf_private.commands where actor_id=actor and command_id=p_command_id;
 if found then
  if previous.action<>p_action or previous.request_hash<>fingerprint then raise exception 'Idempotency conflict' using errcode='GY409';end if;
  return previous.result;
 end if;
 select * into f from public.coach_ratings where relationship_id=ident for update;
 if coalesce(f.revision,0)<>rev then raise exception 'Rating changed' using errcode='GY409';end if;
 insert into public.coach_ratings(relationship_id,rating,revision) values(ident,stars,rev+1)
 on conflict(relationship_id) do update set rating=excluded.rating,revision=excluded.revision,updated_at=now();
 result:=jsonb_build_object('id',ident,'revision',rev+1);
 insert into gymaf_private.commands(actor_id,command_id,action,request_hash,result) values(actor,p_command_id,p_action,fingerprint,result);
 insert into gymaf_private.audit_events(actor_id,action,resource_id,command_id) values(actor,p_action,ident,p_command_id);
 return result;
end $$;
revoke all on function public.gymaf_coach_rating_command(text,uuid,jsonb) from public,anon;
grant execute on function public.gymaf_coach_rating_command(text,uuid,jsonb) to authenticated;
commit;
