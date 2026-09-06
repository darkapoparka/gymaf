\set ON_ERROR_STOP on
begin;
update gymaf_private.application_sessions set revoked_at=null where user_id='a0000000-0000-4000-8000-000000000003';
insert into gymaf_private.billing_runtime(sync_secret) values(repeat('s',64));
insert into auth.users(id,email,email_confirmed_at) select ('a0000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'billing-synthetic-'||n||'@gymaf.example',now() from generate_series(7,9)n;
insert into auth.sessions(id,user_id) select ('b0000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,('a0000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(7,9)n;
create function test_helpers.billing_sign(b jsonb) returns jsonb language sql security definer set search_path='' as $$
 select public.gymaf_billing_sync(b::text,extract(epoch from now())::bigint,encode(extensions.hmac((extract(epoch from now())::bigint)::text||'.'||b::text,repeat('s',64),'sha256'),'hex'))
$$;
grant execute on function test_helpers.billing_sign(jsonb) to authenticated;
set local role authenticated;
select test_helpers.set_actor(6);
select jsonb_build_object('workspaceId','10000000-0000-4000-8000-000000000001','title','Synthetic monthly coaching','sellerName','Synthetic Seller','stripeAccount','acct_synthetic','stripePrice','price_synthetic','amountMinor',9900,'currency','eur','livemode',false,'enabled',true,'guestCapacity',1,'revision',0) as offer \gset
select public.gymaf_billing_command('billing.configure','a1000000-0000-4000-8000-000000000001',:'offer');
select test_helpers.set_actor(1);
select test_helpers.denied(format('select public.gymaf_billing_command(%L,%L,%L::jsonb)','billing.configure','a1000000-0000-4000-8000-000000000002',:'offer'));
select test_helpers.denied('select * from gymaf_private.billing_orders');
select test_helpers.set_actor(3);
select test_helpers.assert((public.gymaf_billing_query()->>'guestCredits')::integer=0,'Manual or complimentary access earns no paid guest credits');
select public.gymaf_billing_command('billing.checkout','a1000000-0000-4000-8000-000000000003','{"relationshipId":"20000000-0000-4000-8000-000000000001","offerRevision":1}')->>'id' as order_id \gset
select test_helpers.assert(public.gymaf_billing_command('billing.checkout','a1000000-0000-4000-8000-000000000004','{"relationshipId":"20000000-0000-4000-8000-000000000001","offerRevision":1}')->>'id'=:'order_id','Two checkout commands share one open order');
select test_helpers.assert((select count(*) from public.service_entitlements where source='stripe')=0,'Checkout order grants no paid access');
select test_helpers.set_actor(4);
select test_helpers.denied($q$select public.gymaf_billing_query('20000000-0000-4000-8000-000000000001')$q$);
select test_helpers.denied($q$select public.gymaf_billing_command('billing.checkout','a1000000-0000-4000-8000-000000000005','{"relationshipId":"20000000-0000-4000-8000-000000000001","offerRevision":1}')$q$);
select test_helpers.set_actor(2);
select test_helpers.denied('select * from gymaf_private.billing_subscriptions');
reset role;
grant usage on schema test_helpers to anon;
set local role anon;
select test_helpers.denied($q$select public.gymaf_billing_sync('{}',null,null)$q$);
select test_helpers.denied($q$select public.gymaf_billing_sync('{}',0,repeat('a',64))$q$);
reset role;
set local role authenticated;
select test_helpers.set_actor(3);
select jsonb_build_object('kind','subscription.sync','eventId','evt_synthetic_paid','orderId',:'order_id','relationshipId','20000000-0000-4000-8000-000000000001','subscriptionId','sub_synthetic','customerId','cus_synthetic','accountId','acct_synthetic','priceId','price_synthetic','currency','eur','amountPaid',9900,'livemode',false,'status','active','cancelAtPeriodEnd',false,'paidStart',now()-interval '1 minute','paidUntil',now()+interval '30 days','invoiceId','in_synthetic','blocked',false,'observedAt',now()) as paid \gset
select test_helpers.denied(format('select test_helpers.billing_sign(%L::jsonb)',(:'paid'::jsonb||'{"accountId":"acct_other"}')::text));
select test_helpers.denied(format('select test_helpers.billing_sign(%L::jsonb)',(:'paid'::jsonb||'{"priceId":"price_cheaper"}')::text));
select test_helpers.billing_sign(:'paid');
select test_helpers.billing_sign(:'paid');
select test_helpers.assert((select count(*) from public.service_entitlements where source='stripe')=1,'Duplicate paid event grants one immutable period');
select test_helpers.assert((public.gymaf_billing_query()->>'guestCredits')::integer=3,'Paid member receives three guest credits');
select test_helpers.set_actor(6);
select public.gymaf_billing_command('billing.configure','a1000000-0000-4000-8000-000000000030',(:'offer'::jsonb||'{"revision":1,"amountMinor":12900,"stripePrice":"price_new","sellerName":"New Seller"}'));
select test_helpers.set_actor(3);
select test_helpers.assert(public.gymaf_billing_query()->'subscription'->'offer'->>'amountMinor'='9900','Existing subscription retains purchased price');
select test_helpers.assert(public.gymaf_billing_query()->'subscription'->'offer'->>'sellerName'='Synthetic Seller','Existing subscription retains purchased seller');
select test_helpers.assert(public.gymaf_billing_query()->'offer'->>'amountMinor'='12900','New purchases see current offer');
select test_helpers.assert(public.gymaf_billing_command('billing.reconcile','a1000000-0000-4000-8000-000000000031','{"relationshipId":"20000000-0000-4000-8000-000000000001"}')->'subscription'->>'subscription_id'='sub_synthetic','Owner can reconcile saved checkout');

select test_helpers.conflict($q$select public.gymaf_billing_command('billing.checkout','a1000000-0000-4000-8000-000000000006','{"relationshipId":"20000000-0000-4000-8000-000000000001","offerRevision":1}')$q$);
select public.gymaf_billing_command('guest.create','a1000000-0000-4000-8000-000000000007',jsonb_build_object('relationshipId','20000000-0000-4000-8000-000000000001','token',repeat('a',64)))->>'id' as pass_a \gset
select public.gymaf_billing_command('guest.create','a1000000-0000-4000-8000-000000000007',jsonb_build_object('relationshipId','20000000-0000-4000-8000-000000000001','token',repeat('a',64)));
select test_helpers.assert((public.gymaf_billing_query()->>'guestCredits')::integer=2,'Pass retry consumes one credit');
select public.gymaf_billing_command('guest.replace-link','a1000000-0000-4000-8000-000000000032',jsonb_build_object('id',:'pass_a','token',repeat('d',64)));
select public.gymaf_billing_command('guest.replace-link','a1000000-0000-4000-8000-000000000032',jsonb_build_object('id',:'pass_a','token',repeat('d',64)));
select test_helpers.assert((public.gymaf_billing_query()->>'guestCredits')::integer=2,'Link replacement and retry consume no new credit');
select test_helpers.denied($q$select public.gymaf_billing_query(null,repeat('a',64))$q$);
select test_helpers.assert(public.gymaf_billing_query(null,repeat('d',64))->>'ownPass'='true','Only replacement link works');
select test_helpers.set_actor(4);
select test_helpers.denied(format('select public.gymaf_billing_command(%L,%L,%L::jsonb)','guest.replace-link','a1000000-0000-4000-8000-000000000033',jsonb_build_object('id',:'pass_a','token',repeat('e',64))));
select test_helpers.denied($q$select public.gymaf_billing_command('billing.reconcile','a1000000-0000-4000-8000-000000000034','{"relationshipId":"20000000-0000-4000-8000-000000000001"}')$q$);
select test_helpers.set_actor(3);

select test_helpers.denied($q$select public.gymaf_billing_command('guest.accept','a1000000-0000-4000-8000-000000000008',jsonb_build_object('token',repeat('d',64)))$q$);
select test_helpers.set_actor(4);
select test_helpers.denied(format('select public.gymaf_billing_command(%L,%L,%L::jsonb)','guest.revoke','a1000000-0000-4000-8000-000000000009',jsonb_build_object('id',:'pass_a')));
select test_helpers.denied($q$select public.gymaf_billing_command('guest.accept','a1000000-0000-4000-8000-000000000010',jsonb_build_object('token',repeat('d',64)))$q$);
select test_helpers.set_actor(7);
select public.gymaf_billing_command('guest.accept','a1000000-0000-4000-8000-000000000011',jsonb_build_object('token',repeat('d',64)))->>'id' as trial_relationship \gset
select test_helpers.assert((select count(*) from public.service_entitlements where source='guest_pass' and ends_at=starts_at+interval '7 days')=1,'New client gets one seven-day nonrenewing trial');
select test_helpers.assert(gymaf_private.can_train(:'trial_relationship'),'Trial is connected to actual training authorization');
select public.gymaf_billing_command('guest.accept','a1000000-0000-4000-8000-000000000011',jsonb_build_object('token',repeat('d',64)));
select test_helpers.set_actor(3);
select public.gymaf_billing_command('guest.create','a1000000-0000-4000-8000-000000000012',jsonb_build_object('relationshipId','20000000-0000-4000-8000-000000000001','token',repeat('b',64)));
select public.gymaf_billing_command('guest.create','a1000000-0000-4000-8000-000000000013',jsonb_build_object('relationshipId','20000000-0000-4000-8000-000000000001','token',repeat('c',64)))->>'id' as pass_c \gset
select test_helpers.denied($q$select public.gymaf_billing_command('guest.create','a1000000-0000-4000-8000-000000000014',jsonb_build_object('relationshipId','20000000-0000-4000-8000-000000000001','token',repeat('d',64)))$q$);
select public.gymaf_billing_command('guest.revoke','a1000000-0000-4000-8000-000000000015',jsonb_build_object('id',:'pass_c'));
select test_helpers.assert((public.gymaf_billing_query()->>'guestCredits')::integer=0,'Revocation cannot mint replacement credits');
select test_helpers.set_actor(8);
select test_helpers.conflict($q$select public.gymaf_billing_command('guest.accept','a1000000-0000-4000-8000-000000000016',jsonb_build_object('token',repeat('b',64)))$q$);
select test_helpers.denied($q$select public.gymaf_billing_command('guest.accept','a1000000-0000-4000-8000-000000000017',jsonb_build_object('token',repeat('c',64)))$q$);
select test_helpers.set_actor(3);
select test_helpers.billing_sign(:'paid'::jsonb||jsonb_build_object('eventId','evt_cancel_at_end','cancelAtPeriodEnd',true,'observedAt',now()+interval '1 second'));
select test_helpers.assert((select state from public.service_entitlements where source='stripe')='active','Cancel at period end preserves paid access');
select test_helpers.billing_sign(:'paid'::jsonb||jsonb_build_object('eventId','evt_refund','blocked',true,'observedAt',now()+interval '2 seconds'));
select test_helpers.assert((select state from public.service_entitlements where source='stripe')='revoked','Full refund or dispute revokes paid entitlement');
select test_helpers.billing_sign(:'paid'::jsonb||jsonb_build_object('eventId','evt_stale_paid','observedAt',now()));
select test_helpers.assert((select state from public.service_entitlements where source='stripe')='revoked','Older snapshot cannot resurrect refunded access');
reset role;
rollback;
