begin;
alter table public.service_entitlements drop constraint service_entitlements_source_check;
alter table public.service_entitlements add constraint service_entitlements_source_check check(source in('complimentary','manual','stripe','guest_pass'));
create table gymaf_private.billing_runtime(singleton boolean primary key default true check(singleton),sync_secret text not null check(length(sync_secret)>=64),live_enabled boolean not null default false);
create table public.billing_offers(
 workspace_id uuid primary key references public.workspaces(id),title text not null,seller_name text not null,
 stripe_account text not null,stripe_price text not null,amount_minor integer not null check(amount_minor between 100 and 1000000),
 currency text not null check(currency='eur'),livemode boolean not null default false,enabled boolean not null default false,
 guest_capacity integer not null default 10 check(guest_capacity between 0 and 100),revision integer not null default 0,
 updated_at timestamptz not null default now()
);
create table gymaf_private.billing_orders(
 id uuid primary key,relationship_id uuid not null references public.coaching_relationships(id),user_id uuid not null references public.app_users(id),
 workspace_id uuid not null references public.workspaces(id),offer jsonb not null,state text not null default 'pending' check(state in('pending','open','complete','expired')),
 session_id text,checkout_url text,created_at timestamptz not null default now()
);
create unique index one_open_checkout on gymaf_private.billing_orders(relationship_id) where state in('pending','open');
create table gymaf_private.billing_subscriptions(
 relationship_id uuid primary key references public.coaching_relationships(id),user_id uuid not null references public.app_users(id),workspace_id uuid not null references public.workspaces(id),
 stripe_account text not null,subscription_id text not null,customer_id text not null,livemode boolean not null,
 offer jsonb not null,status text not null,cancel_at_period_end boolean not null default false,paid_until timestamptz,invoice_id text,
 blocked boolean not null default false,synced_at timestamptz not null,unique(stripe_account,subscription_id)
);
create table gymaf_private.billing_events(id text primary key,kind text not null,processed_at timestamptz not null default now());
create table gymaf_private.guest_passes(
 id uuid primary key default gen_random_uuid(),issuer_id uuid not null references public.app_users(id),workspace_id uuid not null references public.workspaces(id),
 token_hash text not null unique,issued_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '30 days',
 revoked_at timestamptz,accepted_by uuid references public.app_users(id),accepted_at timestamptz,relationship_id uuid references public.coaching_relationships(id)
);
create index guest_issuer_date on gymaf_private.guest_passes(issuer_id,issued_at);
create index guest_workspace on gymaf_private.guest_passes(workspace_id);
create index billing_order_user on gymaf_private.billing_orders(user_id,created_at);
create index billing_subscription_workspace on gymaf_private.billing_subscriptions(workspace_id,user_id);
create unique index one_guest_trial_per_account on gymaf_private.guest_passes(accepted_by) where accepted_by is not null;
alter table public.billing_offers enable row level security;
alter table gymaf_private.billing_runtime enable row level security;
alter table gymaf_private.billing_orders enable row level security;
alter table gymaf_private.billing_subscriptions enable row level security;
alter table gymaf_private.billing_events enable row level security;
alter table gymaf_private.guest_passes enable row level security;
revoke all on public.billing_offers,gymaf_private.billing_runtime,gymaf_private.billing_orders,gymaf_private.billing_subscriptions,gymaf_private.billing_events,gymaf_private.guest_passes from public,anon,authenticated;

create function public.gymaf_billing_query(p_relationship uuid default null,p_guest_token text default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); r public.coaching_relationships; o public.billing_offers; s gymaf_private.billing_subscriptions; g gymaf_private.guest_passes; used integer; eligible boolean;
begin
 if actor is null then raise exception 'Invalid session' using errcode='28000';end if;
 if p_guest_token is not null then
  if p_guest_token !~ '^[a-f0-9]{64}$' then raise exception 'Invalid pass' using errcode='42501';end if;
  select * into g from gymaf_private.guest_passes where token_hash=encode(extensions.digest(p_guest_token,'sha256'),'hex') and expires_at>now() and revoked_at is null and accepted_by is null;
  select * into o from public.billing_offers where workspace_id=g.workspace_id and enabled;
  if g.id is null or o.workspace_id is null then raise exception 'Guest pass unavailable' using errcode='42501';end if;
  return jsonb_build_object('coachName',(select coalesce(nullif(public_name,''),name) from public.workspaces where id=g.workspace_id),'expiresAt',g.expires_at,'ownPass',g.issuer_id=actor,'days',7);
 end if;
 select * into r from public.coaching_relationships where client_user_id=actor and (p_relationship is null or id=p_relationship) order by (state<>'ended') desc,created_at desc limit 1;
 if p_relationship is not null and r.id is null then raise exception 'Relationship unavailable' using errcode='42501';end if;
 select * into o from public.billing_offers where workspace_id=r.workspace_id;
 select * into s from gymaf_private.billing_subscriptions where relationship_id=r.id;
 select count(*) into used from gymaf_private.guest_passes where issuer_id=actor and issued_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC';
 eligible:=s.status in('active','past_due') and not s.blocked and s.paid_until>now() and r.state='active' and o.enabled and o.guest_capacity>0;
 return jsonb_build_object('relationshipId',r.id,'workspaceId',r.workspace_id,'coachName',(select coalesce(nullif(public_name,''),name) from public.workspaces where id=r.workspace_id),
 'offer',case when o.workspace_id is null then null else jsonb_build_object('title',o.title,'sellerName',o.seller_name,'amountMinor',o.amount_minor,'currency',o.currency,'enabled',o.enabled,'livemode',o.livemode,'revision',o.revision) end,
 'subscription',case when s.relationship_id is null then null else jsonb_build_object('status',s.status,'paidUntil',s.paid_until,'cancelAtPeriodEnd',s.cancel_at_period_end,'blocked',s.blocked,'syncedAt',s.synced_at,'offer',jsonb_build_object('title',s.offer->>'title','sellerName',s.offer->>'seller_name','amountMinor',(s.offer->>'amount_minor')::integer,'currency',s.offer->>'currency','livemode',(s.offer->>'livemode')::boolean)) end,
 'guestCredits',case when eligible then greatest(0,3-used) else 0 end,'guestEligible',coalesce(eligible,false),'guestResetsAt',(date_trunc('month',now() at time zone 'UTC')+interval '1 month') at time zone 'UTC',
 'passes',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'expiresAt',expires_at,'used',accepted_by is not null,'revoked',revoked_at is not null) order by issued_at desc),'[]'::jsonb) from gymaf_private.guest_passes where issuer_id=actor and (expires_at>now() or accepted_at>now()-interval '30 days')));
end $$;

create function public.gymaf_billing_command(p_action text,p_command_id uuid,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=gymaf_private.active_actor(); r public.coaching_relationships; o public.billing_offers; ord gymaf_private.billing_orders; s gymaf_private.billing_subscriptions; g gymaf_private.guest_passes; previous gymaf_private.commands; fingerprint text; result jsonb; ident uuid; coach uuid;
begin
 if actor is null then raise exception 'Invalid session' using errcode='28000';end if;
 if p_command_id is null or jsonb_typeof(p) is distinct from 'object' then raise exception 'Invalid command' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,882));
 fingerprint:=encode(extensions.digest(p_action||p::text,'sha256'),'hex');
 select * into previous from gymaf_private.commands where actor_id=actor and command_id=p_command_id;
 if found then if previous.action<>p_action or previous.request_hash<>fingerprint then raise exception 'Idempotency conflict' using errcode='GY409';end if;if p_action='billing.checkout' then return (select to_jsonb(current_order) from gymaf_private.billing_orders current_order where current_order.id=(previous.result->>'id')::uuid and current_order.user_id=actor);end if;return previous.result;end if;
 if p_action='billing.configure' then
  if not gymaf_private.is_operator() then raise exception 'Operator required' using errcode='42501';end if;
  if (p-array['workspaceId','title','sellerName','stripeAccount','stripePrice','amountMinor','currency','livemode','enabled','guestCapacity','revision'])<>'{}'::jsonb or not(p ?& array['workspaceId','title','sellerName','stripeAccount','stripePrice','amountMinor','currency','livemode','enabled','guestCapacity','revision']) then raise exception 'Invalid offer' using errcode='22023';end if;
  if length(p->>'title') not between 1 and 120 or length(p->>'sellerName') not between 1 and 160 or p->>'stripeAccount' !~ '^acct_[A-Za-z0-9]+$' or p->>'stripePrice' !~ '^price_[A-Za-z0-9]+$' then raise exception 'Invalid offer' using errcode='22023';end if;
  if (p->>'livemode')::boolean and not coalesce((select live_enabled from gymaf_private.billing_runtime where singleton),false) then raise exception 'Live activation is disabled' using errcode='42501';end if;
  select * into o from public.billing_offers where workspace_id=(p->>'workspaceId')::uuid for update;
  if coalesce(o.revision,0)<>(p->>'revision')::integer then raise exception 'Offer changed' using errcode='GY409';end if;
  insert into public.billing_offers(workspace_id,title,seller_name,stripe_account,stripe_price,amount_minor,currency,livemode,enabled,guest_capacity,revision)
  values((p->>'workspaceId')::uuid,p->>'title',p->>'sellerName',p->>'stripeAccount',p->>'stripePrice',(p->>'amountMinor')::integer,p->>'currency',(p->>'livemode')::boolean,(p->>'enabled')::boolean,(p->>'guestCapacity')::integer,1)
  on conflict(workspace_id) do update set title=excluded.title,seller_name=excluded.seller_name,stripe_account=excluded.stripe_account,stripe_price=excluded.stripe_price,amount_minor=excluded.amount_minor,currency=excluded.currency,livemode=excluded.livemode,enabled=excluded.enabled,guest_capacity=excluded.guest_capacity,revision=public.billing_offers.revision+1,updated_at=now();
  result:=jsonb_build_object('id',p->>'workspaceId');
 elsif p_action='billing.checkout' then
  if (p-array['relationshipId','offerRevision'])<>'{}'::jsonb or not(p ?& array['relationshipId','offerRevision']) then raise exception 'Invalid checkout' using errcode='22023';end if;
  select * into r from public.coaching_relationships where id=(p->>'relationshipId')::uuid and client_user_id=actor and state='active';
  if r.id is null then raise exception 'Active relationship required' using errcode='42501';end if;
  select * into o from public.billing_offers where workspace_id=r.workspace_id and enabled;
  if o.workspace_id is null or o.revision is distinct from (p->>'offerRevision')::integer then raise exception 'Refresh the offer' using errcode='GY409';end if;
  if exists(select 1 from gymaf_private.billing_subscriptions where relationship_id=r.id and status not in('canceled','incomplete_expired')) then raise exception 'Manage existing subscription' using errcode='GY409';end if;
  select * into ord from gymaf_private.billing_orders where relationship_id=r.id and state in('pending','open') for update;
  if ord.id is null then
   insert into gymaf_private.billing_orders(id,relationship_id,user_id,workspace_id,offer) values(p_command_id,r.id,actor,r.workspace_id,to_jsonb(o)) returning * into ord;
  end if;
  result:=to_jsonb(ord);
 elsif p_action='billing.reconcile' then
  if (p-'relationshipId')<>'{}'::jsonb then raise exception 'Invalid reconciliation' using errcode='22023';end if;
  select * into r from public.coaching_relationships where id=(p->>'relationshipId')::uuid and client_user_id=actor;
  if r.id is null then raise exception 'Relationship unavailable' using errcode='42501';end if;
  select * into s from gymaf_private.billing_subscriptions where relationship_id=r.id;
  select * into ord from gymaf_private.billing_orders where relationship_id=r.id and user_id=actor order by created_at desc limit 1;
  return jsonb_build_object('subscription',case when s.relationship_id is null then null else to_jsonb(s) end,'order',case when ord.id is null then null else to_jsonb(ord) end);
 elsif p_action='billing.portal' then
  if (p-'relationshipId')<>'{}'::jsonb then raise exception 'Invalid portal' using errcode='22023';end if;
  select * into s from gymaf_private.billing_subscriptions where relationship_id=(p->>'relationshipId')::uuid and user_id=actor;
  if s.relationship_id is null then raise exception 'Subscription unavailable' using errcode='42501';end if;
  result:=to_jsonb(s);
 elsif p_action='guest.create' then
  if (p-array['relationshipId','token'])<>'{}'::jsonb or p->>'token' is null or p->>'token' !~ '^[a-f0-9]{64}$' then raise exception 'Invalid pass' using errcode='22023';end if;
  select * into r from public.coaching_relationships where id=(p->>'relationshipId')::uuid and client_user_id=actor and state='active';
  if r.id is null or (public.gymaf_billing_query(r.id)->>'guestCredits')::integer<1 then raise exception 'No guest credits available' using errcode='42501';end if;
  insert into gymaf_private.guest_passes(issuer_id,workspace_id,token_hash) values(actor,r.workspace_id,encode(extensions.digest(p->>'token','sha256'),'hex')) returning id into ident;
  result:=jsonb_build_object('id',ident);
 elsif p_action='guest.replace-link' then
  if (p-array['id','token'])<>'{}'::jsonb or p->>'token' is null or p->>'token' !~ '^[a-f0-9]{64}$' then raise exception 'Invalid pass' using errcode='22023';end if;
  update gymaf_private.guest_passes set token_hash=encode(extensions.digest(p->>'token','sha256'),'hex') where id=(p->>'id')::uuid and issuer_id=actor and accepted_by is null and revoked_at is null and expires_at>now() returning id into ident;
  if ident is null then raise exception 'Pass unavailable' using errcode='42501';end if;
  result:=jsonb_build_object('id',ident);
 elsif p_action='guest.revoke' then
  if (p-'id')<>'{}'::jsonb then raise exception 'Invalid pass' using errcode='22023';end if;
  update gymaf_private.guest_passes set revoked_at=coalesce(revoked_at,now()) where id=(p->>'id')::uuid and issuer_id=actor and accepted_by is null returning id into ident;
  if ident is null then raise exception 'Pass unavailable' using errcode='42501';end if;result:=jsonb_build_object('id',ident);
 elsif p_action='guest.accept' then
  if (p-'token')<>'{}'::jsonb or p->>'token' is null or p->>'token' !~ '^[a-f0-9]{64}$' then raise exception 'Invalid pass' using errcode='22023';end if;
  select * into g from gymaf_private.guest_passes where token_hash=encode(extensions.digest(p->>'token','sha256'),'hex') for update;
  if g.id is null or g.issuer_id=actor or g.expires_at<=now() or g.revoked_at is not null or g.accepted_by is not null then raise exception 'Pass unavailable' using errcode='42501';end if;
  perform pg_advisory_xact_lock(hashtextextended(g.workspace_id::text,883));
  select * into o from public.billing_offers where workspace_id=g.workspace_id and enabled;
  if o.workspace_id is null or not exists(select 1 from gymaf_private.billing_subscriptions where user_id=g.issuer_id and workspace_id=g.workspace_id and status in('active','past_due') and paid_until>now() and not blocked) or exists(select 1 from public.coaching_relationships where client_user_id=actor) or exists(select 1 from gymaf_private.guest_passes where accepted_by=actor) then raise exception 'Pass is for new clients only' using errcode='42501';end if;
  if (select count(*) from public.service_entitlements where workspace_id=g.workspace_id and source='guest_pass' and ends_at>now() and state<>'revoked')>=o.guest_capacity then raise exception 'Coach trial capacity reached' using errcode='GY409';end if;
  select m.user_id into coach from public.workspace_memberships m join public.workspaces w on w.id=m.workspace_id where m.workspace_id=g.workspace_id and m.role='owner' and m.status='active' and w.status='active' order by m.user_id limit 1;
  if coach is null or coach=actor then raise exception 'Coach unavailable' using errcode='42501';end if;
  insert into public.coaching_relationships(workspace_id,client_user_id,coach_user_id) values(g.workspace_id,actor,coach) returning id into ident;
  insert into public.service_entitlements(workspace_id,relationship_id,source,starts_at,ends_at) values(g.workspace_id,ident,'guest_pass',now(),now()+interval '7 days');
  update gymaf_private.guest_passes set accepted_by=actor,accepted_at=now(),relationship_id=ident where id=g.id;
  insert into public.notifications(user_id,event_id,kind,path) values(coach,p_command_id,'guest_trial_started','/coach/clients/'||ident::text);
  result:=jsonb_build_object('id',ident);
 else raise exception 'Unknown billing command' using errcode='22023';end if;
 insert into gymaf_private.commands(actor_id,command_id,action,request_hash,result)values(actor,p_command_id,p_action,fingerprint,result);
 insert into gymaf_private.audit_events(actor_id,action,resource_id,command_id)values(actor,p_action,coalesce(ident,(result->>'id')::uuid),p_command_id);
 return result;
end $$;

-- Only the server holding the separate HMAC secret can acknowledge provider state.
-- Neither an application user nor a browser success redirect can grant paid access.
create function public.gymaf_billing_sync(p_body text,p_time bigint,p_proof text) returns jsonb language plpgsql security definer set search_path='' as $$
declare secret text; b jsonb; ord gymaf_private.billing_orders; sub gymaf_private.billing_subscriptions; rid uuid; eid uuid; observed timestamptz; start_time timestamptz; end_time timestamptz; status_text text;
begin
 select sync_secret into secret from gymaf_private.billing_runtime where singleton;
 if secret is null or p_time is null or p_body is null or p_proof is null or p_proof !~ '^[a-f0-9]{64}$' or abs(extract(epoch from now())-p_time)>300 or length(p_body)>65536 or p_proof is distinct from encode(extensions.hmac(p_time::text||'.'||p_body,secret,'sha256'),'hex') then raise exception 'Invalid billing proof' using errcode='42501';end if;
 b:=p_body::jsonb;
 if b->>'kind'='order.attach' then
  select * into ord from gymaf_private.billing_orders where id=(b->>'orderId')::uuid for update;
  if ord.id is null or b->>'sessionId' !~ '^cs_' or b->>'url' !~ '^https://checkout[.]stripe[.]com/' then raise exception 'Invalid checkout acknowledgement' using errcode='22023';end if;
  if ord.session_id is not null and ord.session_id<>b->>'sessionId' then raise exception 'Checkout already attached' using errcode='GY409';end if;
  update gymaf_private.billing_orders set session_id=b->>'sessionId',checkout_url=b->>'url',state='open' where id=ord.id and state in('pending','open');
 elsif b->>'kind'='order.expire' then
  update gymaf_private.billing_orders set state='expired' where id=(b->>'orderId')::uuid and state in('pending','open');
 elsif b->>'kind'='subscription.sync' then
  rid:=(b->>'relationshipId')::uuid;observed:=(b->>'observedAt')::timestamptz;status_text:=b->>'status';
  if observed>now()+interval '5 minutes' or observed<now()-interval '10 minutes' or status_text not in('active','past_due','unpaid','canceled','incomplete','incomplete_expired','paused','trialing') then raise exception 'Invalid subscription snapshot' using errcode='22023';end if;
  perform pg_advisory_xact_lock(hashtextextended(rid::text,884));
  select * into ord from gymaf_private.billing_orders where id=(b->>'orderId')::uuid and relationship_id=rid;
  if ord.id is null or (ord.offer->>'stripe_account') is distinct from (b->>'accountId') or (ord.offer->>'stripe_price') is distinct from (b->>'priceId') or (ord.offer->>'livemode')::boolean is distinct from (b->>'livemode')::boolean then raise exception 'Seller mismatch' using errcode='42501';end if;
  select * into sub from gymaf_private.billing_subscriptions where relationship_id=rid;
  if sub.synced_at is not null and sub.synced_at>observed then return jsonb_build_object('ignored',true);end if;
  if sub.subscription_id is not null and sub.subscription_id<>b->>'subscriptionId' and sub.status not in('canceled','incomplete_expired') then raise exception 'Duplicate subscription requires reconciliation' using errcode='GY409';end if;
  if exists(select 1 from gymaf_private.billing_events where id=b->>'eventId') then return jsonb_build_object('duplicate',true);end if;
  start_time:=(b->>'paidStart')::timestamptz;end_time:=(b->>'paidUntil')::timestamptz;
  if end_time is not null and ((b->>'amountPaid')::integer<1 or (b->>'currency') is distinct from (ord.offer->>'currency') or start_time is null or end_time<=start_time or end_time>now()+interval '2 years') then raise exception 'Invalid paid period' using errcode='22023';end if;
  insert into gymaf_private.billing_subscriptions(relationship_id,user_id,workspace_id,stripe_account,subscription_id,customer_id,livemode,offer,status,cancel_at_period_end,paid_until,invoice_id,blocked,synced_at)
  values(rid,ord.user_id,ord.workspace_id,b->>'accountId',b->>'subscriptionId',b->>'customerId',(b->>'livemode')::boolean,ord.offer,status_text,(b->>'cancelAtPeriodEnd')::boolean,coalesce(end_time,sub.paid_until),coalesce(b->>'invoiceId',sub.invoice_id),(b->>'blocked')::boolean,observed)
  on conflict(relationship_id) do update set stripe_account=excluded.stripe_account,livemode=excluded.livemode,offer=excluded.offer,subscription_id=excluded.subscription_id,customer_id=excluded.customer_id,status=excluded.status,cancel_at_period_end=excluded.cancel_at_period_end,paid_until=excluded.paid_until,invoice_id=excluded.invoice_id,blocked=excluded.blocked,synced_at=excluded.synced_at;
  if (b->>'blocked')::boolean or status_text in('canceled','unpaid','paused','incomplete_expired') then
   update public.service_entitlements set state='revoked' where relationship_id=rid and source='stripe';
   update gymaf_private.guest_passes set revoked_at=coalesce(revoked_at,now()) where issuer_id=ord.user_id and workspace_id=ord.workspace_id and accepted_by is null;
  elsif end_time>now() and status_text in('active','past_due') then
   eid:=md5((b->>'accountId')||':'||(b->>'invoiceId'))::uuid;
   insert into public.service_entitlements(id,workspace_id,relationship_id,source,starts_at,ends_at) values(eid,ord.workspace_id,rid,'stripe',start_time,end_time) on conflict(id) do nothing;
  end if;
  update gymaf_private.billing_orders set state='complete' where id=ord.id;
  insert into gymaf_private.billing_events(id,kind) values(b->>'eventId','subscription.sync');
 else raise exception 'Unknown billing synchronization' using errcode='22023';end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.gymaf_billing_query(uuid,text),public.gymaf_billing_command(text,uuid,jsonb),public.gymaf_billing_sync(text,bigint,text) from public,anon,authenticated;
grant execute on function public.gymaf_billing_query(uuid,text),public.gymaf_billing_command(text,uuid,jsonb) to authenticated;
grant execute on function public.gymaf_billing_sync(text,bigint,text) to anon;
commit;
