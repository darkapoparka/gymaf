import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import {createHmac} from 'node:crypto';
import Stripe from 'stripe';

test('billing HTTP keeps price/seller ownership, verifies signatures, and grants only paid invoice snapshots',{timeout:60000},async()=>{
 const id='a1000000-0000-4000-8000-000000000003',rid='20000000-0000-4000-8000-000000000001',secret='s'.repeat(64),webhookSecret='whsec_synthetic';
 const order={id,relationship_id:rid,created_at:new Date().toISOString(),session_id:null,checkout_url:null,offer:{stripe_account:'acct_synthetic',stripe_price:'price_synthetic',amount_minor:9900,currency:'eur',livemode:false}};
 const writes=[],snapshots=[];let failAttach=true,paid=false,blocked=false,canceled=false;
 const fixture=createServer(async(req,res)=>{
  let raw='';for await(const chunk of req)raw+=chunk;const body=req.headers['content-type']?.includes('json')?JSON.parse(raw||'{}'):Object.fromEntries(new URLSearchParams(raw));
  const path=new URL(req.url,'http://fixture').pathname;res.setHeader('Content-Type','application/json');const reply=(value,status=200)=>{res.statusCode=status;res.end(JSON.stringify(value));};
  if(path==='/auth/v1/user')return reply({id:'synthetic',email_confirmed_at:'2026-09-06'});
  if(path==='/rest/v1/rpc/gymaf_billing_command'){
   if(body.p.relationshipId!==rid)return reply({code:'42501'},403);
   if(body.p_action==='billing.checkout')return reply(order);
   if(body.p_action==='billing.reconcile')return reply({subscription:null,order});
   return reply({stripe_account:'acct_synthetic',customer_id:'cus_synthetic',subscription_id:'sub_synthetic',livemode:false});
  }
  if(path==='/rest/v1/rpc/gymaf_billing_query')return reply({offer:null,passes:[]});
  if(path==='/rest/v1/rpc/gymaf_billing_sync'){
   assert.equal(body.p_proof,createHmac('sha256',secret).update(body.p_time+'.'+body.p_body).digest('hex'));const snapshot=JSON.parse(body.p_body);
   if(snapshot.kind==='order.attach'&&failAttach){failAttach=false;return reply({},503);}
   if(snapshot.kind==='order.attach'){order.session_id=snapshot.sessionId;order.checkout_url=snapshot.url;}
   snapshots.push(snapshot);return reply({ok:true});
  }
  if(path==='/v1/account')return reply({id:'acct_synthetic',charges_enabled:true});
  if(path==='/v1/prices/price_synthetic')return reply({id:'price_synthetic',active:true,unit_amount:9900,currency:'eur',livemode:false,recurring:{interval:'month',interval_count:1}});
  if(path==='/v1/checkout/sessions'&&req.method==='POST'){writes.push({body,key:req.headers['idempotency-key']});return reply({id:'cs_synthetic',url:'https://checkout.stripe.com/c/pay/synthetic',status:'open'});}
  if(path==='/v1/checkout/sessions/cs_synthetic')return reply({id:'cs_synthetic',url:'https://checkout.stripe.com/c/pay/synthetic',status:paid?'complete':'open',payment_status:paid?'paid':'unpaid',subscription:paid?'sub_synthetic':null});
  if(path==='/v1/subscriptions/sub_synthetic'&&req.method==='GET')return reply({id:'sub_synthetic',customer:'cus_synthetic',status:canceled?'canceled':'active',cancel_at_period_end:false,livemode:false,metadata:{gymaf_order:id,gymaf_relationship:rid,gymaf_price:'price_synthetic'}});
  if(path==='/v1/subscriptions/sub_synthetic'&&req.method==='POST')return reply({id:'sub_synthetic'});
  if(path==='/v1/invoices')return reply({object:'list',data:paid?[{id:'in_synthetic',amount_paid:9900,currency:'eur',status:'paid'}]:[],has_more:false});
  if(path==='/v1/invoices/in_synthetic/lines')return reply({object:'list',data:[{pricing:{price_details:{price:'price_synthetic'}},period:{start:Math.floor(Date.now()/1000)-60,end:Math.floor(Date.now()/1000)+86400*30},parent:{subscription_item_details:{proration:false}}}],has_more:false});
  if(path==='/v1/invoice_payments')return reply({object:'list',data:[{payment:{type:'charge',charge:'ch_synthetic'}}],has_more:false});
  if(path==='/v1/charges/ch_synthetic')return reply({id:'ch_synthetic',refunded:blocked,disputed:false});
  if(path==='/v1/billing_portal/configurations')return reply({id:'bpc_synthetic'});
  if(path==='/v1/billing_portal/sessions'){assert.equal(body.customer,'cus_synthetic');return reply({url:'https://billing.stripe.com/p/session/synthetic'});}
  return reply({error:{message:'Unexpected synthetic path '+path}},404);
 });
 fixture.listen(0,'127.0.0.1');await once(fixture,'listening');
 const reservation=createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const origin='http://127.0.0.1:'+port;
 const child=spawn(process.execPath,['--import','./tests/fixtures/stripe-transport.mjs','node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{windowsHide:true,stdio:'ignore',env:{...process.env,APP_ORIGIN:origin,SUPABASE_URL:'http://127.0.0.1:'+fixture.address().port,SUPABASE_PUBLISHABLE_KEY:'fixture-public',STRIPE_SECRET_KEY:'sk_test_synthetic',STRIPE_WEBHOOK_SECRET:webhookSecret,GYMAF_BILLING_SYNC_SECRET:secret,TEST_STRIPE_FIXTURE_PORT:String(fixture.address().port)}});
 try{
  let ready=false;for(let i=0;i<150;i++){try{ready=(await fetch(origin+'/login')).ok;}catch{}if(ready)break;await delay(100);}assert.equal(ready,true);
  const headers={Origin:origin,cookie:'gymaf-access=fixture','Content-Type':'application/json'},payload={commandId:id,relationshipId:rid,offerRevision:1};
  const post=(action,body=payload,extra={})=>fetch(origin+'/api/v1/billing/'+action,{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)});
  assert.equal((await fetch(origin+'/api/v1/me/billing')).status,401);
  assert.equal((await post('checkout',payload,{Origin:'https://wrong.example'})).status,403);
  assert.equal((await post('checkout',{...payload,amountMinor:1})).status,422);
  assert.equal((await post('checkout',{...payload,relationshipId:'20000000-0000-4000-8000-000000000099'})).status,403);
  const firstCheckout=await post('checkout');assert.equal(firstCheckout.status,503,'Lost DB acknowledgement: '+await firstCheckout.text()+'; writes='+JSON.stringify(writes));
  assert.equal((await post('checkout')).status,200);assert.equal(writes.length,2);assert.equal(writes[0].key,writes[1].key);assert.deepEqual(writes[0].body,writes[1].body);
  assert.equal(writes[0].body['line_items[0][price]'],'price_synthetic');assert.equal(writes[0].body.mode,'subscription');assert.equal(snapshots.filter(s=>s.kind==='subscription.sync').length,0);
  const event={id:'evt_synthetic',object:'event',type:'customer.subscription.updated',livemode:false,data:{object:{id:'sub_synthetic'}}};
  const webhook=async(value,bad=false)=>{const raw=JSON.stringify(value),signature=Stripe.webhooks.generateTestHeaderString({payload:raw,secret:webhookSecret});return fetch(origin+'/api/v1/billing/webhook',{method:'POST',headers:{'stripe-signature':bad?'invalid':signature,'Content-Type':'application/json'},body:raw});};
  assert.equal((await webhook(event,true)).status,400);assert.equal((await webhook(event)).status,200);assert.equal(snapshots.at(-1).paidUntil,null,'Unpaid event creates no paid period');
  paid=true;const recovered=await post('refresh',{commandId:id,relationshipId:rid});assert.equal(recovered.status,200);assert.equal((await recovered.json()).data.status,'confirmed','Delayed webhook recovers from the owned checkout');assert.ok(snapshots.at(-1).paidUntil);assert.equal((await webhook({...event,id:'evt_paid'})).status,200);assert.ok(snapshots.at(-1).paidUntil);assert.equal(snapshots.at(-1).priceId,'price_synthetic');
  blocked=true;assert.equal((await webhook({...event,id:'evt_refunded'})).status,200);assert.equal(snapshots.at(-1).blocked,true);assert.equal(snapshots.at(-1).cancelAtPeriodEnd,true);
  canceled=true;assert.equal((await webhook({...event,id:'evt_canceled'})).status,200);assert.equal(snapshots.at(-1).status,'canceled');
  assert.equal((await post('portal',{commandId:id,relationshipId:rid})).status,200);
  for(const path of ['/design-review','/preview','/review'])assert.equal((await fetch(origin+path)).status,404,'Production excludes '+path);
 }finally{child.kill();await once(child,'exit');await new Promise(r=>fixture.close(r));}
});
