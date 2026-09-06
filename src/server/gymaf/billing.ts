import Stripe from 'stripe';
import { createHmac } from 'node:crypto';
import { config, HttpError, rpc, success } from './http';
import { text, uuid } from '@/shared/gymaf/validation';

type Offer={workspace_id:string;title:string;seller_name:string;stripe_account:string;stripe_price:string;amount_minor:number;currency:string;livemode:boolean};
type Order={id:string;relationship_id:string;created_at:string;offer:Offer;session_id:string|null;checkout_url:string|null};
const identifier=(value:string|{id:string}|null|undefined)=>typeof value==='string'?value:value?.id;
export function stripeClient(){
 const key=process.env.STRIPE_SECRET_KEY;
 if(!key||!/^([sr]k)_(test|live)_/.test(key))throw new HttpError(503,'BILLING_SETUP_REQUIRED','Stripe is not connected yet. Your account has not been charged.');
 if(key.includes('_live_')&&process.env.GYMAF_STRIPE_LIVE_ENABLED!=='true')throw new HttpError(503,'LIVE_BILLING_DISABLED','Live billing has not been activated.');
 return new Stripe(key,{maxNetworkRetries:2,timeout:12000});
}
async function synchronize(body:Record<string,unknown>){
 const secret=process.env.GYMAF_BILLING_SYNC_SECRET;
 if(!secret||secret.length<64)throw new HttpError(503,'BILLING_SETUP_REQUIRED','Payment confirmation is not configured.');
 const raw=JSON.stringify(body),timestamp=Math.floor(Date.now()/1000);
 return rpc('gymaf_billing_sync',{p_body:raw,p_time:timestamp,p_proof:createHmac('sha256',secret).update(timestamp+'.'+raw).digest('hex')});
}
async function accountOptions(stripe:Stripe,accountId:string){
 const current=await stripe.accounts.retrieve(null);
 return current.id===accountId?{}:{stripeAccount:accountId};
}
function mode(livemode:boolean){if(livemode!==!!process.env.STRIPE_SECRET_KEY?.includes('_live_'))throw new HttpError(409,'BILLING_MODE_MISMATCH','The offer belongs to another payment environment.');}
export async function configureBilling(token:string,p:Record<string,unknown>){
 await rpc('gymaf_query',{p_kind:'operator'},token);
 const commandId=uuid(p.commandId),workspaceId=uuid(p.workspaceId),accountId=text(p.accountId,'Stripe account',80,6);
 if(Object.keys(p).some(k=>!['commandId','workspaceId','accountId','amountMinor','guestCapacity','enabled','revision'].includes(k))||!/^acct_[A-Za-z0-9]+$/.test(accountId)||!Number.isInteger(p.amountMinor)||Number(p.amountMinor)<100||Number(p.amountMinor)>1000000||!Number.isInteger(p.guestCapacity)||Number(p.guestCapacity)<0||Number(p.guestCapacity)>100||typeof p.enabled!=='boolean'||!Number.isInteger(p.revision))throw new HttpError(422,'INVALID_OFFER','Check the monthly price and trial capacity.');
 const stripe=stripeClient(),options=await accountOptions(stripe,accountId),account=await stripe.accounts.retrieve(accountId);
 if(!account.charges_enabled)throw new HttpError(409,'SELLER_NOT_READY','Complete Stripe seller onboarding before enabling this offer.');
 const seller=account.business_profile?.name||account.settings?.dashboard?.display_name;
 if(!seller)throw new HttpError(409,'SELLER_NAME_REQUIRED','Set the seller’s business name in Stripe first.');
 const product=await stripe.products.create({name:'Monthly personal coaching',metadata:{gymaf_workspace:workspaceId}},{...options,idempotencyKey:commandId+':product'});
 const price=await stripe.prices.create({product:product.id,currency:'eur',unit_amount:Number(p.amountMinor),recurring:{interval:'month'},tax_behavior:'inclusive'},{...options,idempotencyKey:commandId+':price'});
 return success(await rpc('gymaf_billing_command',{p_action:'billing.configure',p_command_id:commandId,p:{workspaceId,title:'Monthly personal coaching',sellerName:seller,stripeAccount:accountId,stripePrice:price.id,amountMinor:price.unit_amount,currency:price.currency,livemode:price.livemode,enabled:p.enabled,guestCapacity:p.guestCapacity,revision:p.revision}},token));
}
export async function checkout(token:string,p:Record<string,unknown>){
 if(Object.keys(p).some(k=>!['commandId','relationshipId','offerRevision'].includes(k))||!Number.isInteger(p.offerRevision))throw new HttpError(422,'INVALID_CHECKOUT','Refresh the membership offer.');
 const stripe=stripeClient(); // Fail before reserving an order if credentials are absent.
 const order=await rpc('gymaf_billing_command',{p_action:'billing.checkout',p_command_id:uuid(p.commandId),p:{relationshipId:uuid(p.relationshipId),offerRevision:p.offerRevision}},token) as Order;
 mode(order.offer.livemode);const options=await accountOptions(stripe,order.offer.stripe_account);
 if(order.session_id){
  const session=await stripe.checkout.sessions.retrieve(order.session_id,{},options);
  if(session.status==='complete'&&identifier(session.subscription)){await reconcileSubscription(stripe,identifier(session.subscription)!,order.offer.stripe_account,'refresh:'+crypto.randomUUID());return success({confirmed:true});}
  if(session.status==='expired'){await synchronize({kind:'order.expire',orderId:order.id});throw new HttpError(409,'CHECKOUT_EXPIRED','This checkout expired. Refresh the offer to start a new checkout.');}
  if(session.url)return success({url:session.url});
 }
 if(Date.now()-Date.parse(order.created_at)>23*3600000)throw new HttpError(409,'CHECKOUT_RECONCILIATION_REQUIRED','An earlier checkout needs reconciliation. Contact support before starting another payment.');
 const price=await stripe.prices.retrieve(order.offer.stripe_price,{},options);
 if(!price.active||price.unit_amount!==order.offer.amount_minor||price.currency!==order.offer.currency||price.recurring?.interval!=='month'||price.recurring.interval_count!==1||price.livemode!==order.offer.livemode)throw new HttpError(409,'OFFER_CHANGED','The payment offer changed. Refresh or contact your coach.');
 const session=await stripe.checkout.sessions.create({mode:'subscription',payment_method_types:['card'],line_items:[{price:price.id,quantity:1}],client_reference_id:order.id,
  subscription_data:{metadata:{gymaf_order:order.id,gymaf_relationship:order.relationship_id,gymaf_price:price.id}},
  metadata:{gymaf_order:order.id},success_url:config().origin+'/app/account/plan?checkout=returned',cancel_url:config().origin+'/app/checkout',expires_at:Math.floor(Date.parse(order.created_at)/1000)+24*3600,
 },{...options,idempotencyKey:order.id+':checkout'});
 if(!session.url)throw new HttpError(503,'CHECKOUT_UNAVAILABLE','Stripe did not provide a checkout. Retry the same request.');
 await synchronize({kind:'order.attach',orderId:order.id,sessionId:session.id,url:session.url});return success({url:session.url});
}
export async function billingPortal(token:string,p:Record<string,unknown>,refreshOnly=false){
 if(Object.keys(p).some(k=>!['commandId','relationshipId'].includes(k)))throw new HttpError(422,'INVALID_BILLING_REQUEST','Invalid billing request.');
 if(refreshOnly){
  const state=await rpc('gymaf_billing_command',{p_action:'billing.reconcile',p_command_id:uuid(p.commandId),p:{relationshipId:uuid(p.relationshipId)}},token) as {subscription:{subscription_id:string;stripe_account:string;livemode:boolean}|null;order:Order|null};
  const stripe=stripeClient();
  if(state.subscription){mode(state.subscription.livemode);await reconcileSubscription(stripe,state.subscription.subscription_id,state.subscription.stripe_account,'refresh:'+crypto.randomUUID());return success({status:'confirmed'});}
  if(!state.order?.session_id)return success({status:'pending'});
  const order=state.order;mode(order.offer.livemode);const options=await accountOptions(stripe,order.offer.stripe_account);
  const session=await stripe.checkout.sessions.retrieve(order.session_id!,{},options);
  if(session.status==='complete'&&identifier(session.subscription)){await reconcileSubscription(stripe,identifier(session.subscription)!,order.offer.stripe_account,'refresh:'+crypto.randomUUID());return success({status:session.payment_status==='paid'?'confirmed':'pending'});}
  if(session.status==='expired'){await synchronize({kind:'order.expire',orderId:order.id});return success({status:'expired'});}
  return success({status:'pending'});
 }
 const saved=await rpc('gymaf_billing_command',{p_action:'billing.portal',p_command_id:uuid(p.commandId),p:{relationshipId:uuid(p.relationshipId)}},token) as {stripe_account:string;customer_id:string;subscription_id:string;livemode:boolean};
 mode(saved.livemode);const stripe=stripeClient(),options=await accountOptions(stripe,saved.stripe_account);
 const portalConfig=await stripe.billingPortal.configurations.create({features:{customer_update:{enabled:false},invoice_history:{enabled:true},payment_method_update:{enabled:true},subscription_update:{enabled:false},subscription_cancel:{enabled:true,mode:'at_period_end',proration_behavior:'none'}}},{...options,idempotencyKey:'gymaf-monthly-portal-v1:'+saved.stripe_account});
 const portal=await stripe.billingPortal.sessions.create({customer:saved.customer_id,configuration:portalConfig.id,return_url:config().origin+'/app/account/plan'},options);return success({url:portal.url});
}
export async function reconcileSubscription(stripe:Stripe,subscriptionId:string,accountId:string,eventId:string){
 const observedAt=new Date().toISOString(),options=await accountOptions(stripe,accountId),sub=await stripe.subscriptions.retrieve(subscriptionId,{},options);
 if(!sub.metadata.gymaf_order||!sub.metadata.gymaf_relationship||!sub.metadata.gymaf_price)return;
 const invoices=await stripe.invoices.list({subscription:sub.id,status:'paid',limit:1,expand:['data.payments']},options);
 const invoice=invoices.data[0];let blocked=false,paidStart:string|null=null,paidUntil:string|null=null;
 if(invoice&&invoice.amount_paid>0&&invoice.status==='paid'){
  // A paid invoice must contain this subscription's approved price and actual period.
  const lines=await stripe.invoices.listLineItems(invoice.id,{limit:100},options);
  const line=lines.data.find(item=>item.pricing?.price_details?.price===sub.metadata.gymaf_price&&!item.parent?.subscription_item_details?.proration);
  if(line){paidStart=new Date(line.period.start*1000).toISOString();paidUntil=new Date(line.period.end*1000).toISOString();}
  const payments=await stripe.invoicePayments.list({invoice:invoice.id,status:'paid',limit:100},options);
  for(const payment of payments.data){
   let chargeId=identifier(payment.payment.charge);
   const intentId=identifier(payment.payment.payment_intent);
   if(intentId){const intent=await stripe.paymentIntents.retrieve(intentId,{},options);chargeId=identifier(intent.latest_charge);}
   if(chargeId){const charge=await stripe.charges.retrieve(chargeId,{},options);if(charge.refunded||charge.disputed)blocked=true;}
  }
 }
 if(blocked&&!sub.cancel_at_period_end&&sub.status!=='canceled')await stripe.subscriptions.update(sub.id,{cancel_at_period_end:true},{...options,idempotencyKey:eventId+':stop-renewal'});
 await synchronize({kind:'subscription.sync',eventId,orderId:sub.metadata.gymaf_order,relationshipId:sub.metadata.gymaf_relationship,subscriptionId:sub.id,accountId,customerId:identifier(sub.customer),livemode:sub.livemode,status:sub.status,cancelAtPeriodEnd:sub.cancel_at_period_end||blocked,paidStart,paidUntil,invoiceId:invoice?.id||null,priceId:sub.metadata.gymaf_price,amountPaid:invoice?.amount_paid||0,currency:invoice?.currency||null,blocked,observedAt});
}
export async function stripeWebhook(request:Request){
 const stripe=stripeClient(),secret=process.env.STRIPE_WEBHOOK_SECRET,signature=request.headers.get('stripe-signature');
 if(!secret||!signature)throw new HttpError(400,'INVALID_SIGNATURE','Webhook signature required.');
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'INVALID_EVENT','Missing event.');const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>262144){await reader.cancel();throw new HttpError(413,'EVENT_TOO_LARGE','Event exceeds size limit.');}chunks.push(next.value);}}finally{reader.releaseLock();}
 let event:Stripe.Event;try{event=stripe.webhooks.constructEvent(Buffer.concat(chunks),signature,secret);}catch{throw new HttpError(400,'INVALID_SIGNATURE','Webhook signature invalid.');}
 mode(event.livemode);const accountId=event.account||(await stripe.accounts.retrieve(null)).id,options=await accountOptions(stripe,accountId),value=event.data.object;
 let subscriptionId:string|undefined;
 if(event.type.startsWith('customer.subscription.'))subscriptionId=(value as Stripe.Subscription).id;
 else if(event.type.startsWith('invoice.'))subscriptionId=identifier((value as Stripe.Invoice).parent?.subscription_details?.subscription);
 else if(event.type.startsWith('checkout.session.')){
  const session=value as Stripe.Checkout.Session;subscriptionId=identifier(session.subscription);
  if(event.type==='checkout.session.expired'&&session.metadata?.gymaf_order)await synchronize({kind:'order.expire',orderId:session.metadata.gymaf_order});
 }else if(event.type==='charge.refunded'||event.type.startsWith('charge.dispute.')){
  const chargeId=event.type==='charge.refunded'?(value as Stripe.Charge).id:identifier((value as Stripe.Dispute).charge);
  if(chargeId){const charge=await stripe.charges.retrieve(chargeId,{},options),intentId=identifier(charge.payment_intent);
   if(intentId){const payments=await stripe.invoicePayments.list({payment:{type:'payment_intent',payment_intent:intentId},limit:10},options);const invoiceId=identifier(payments.data[0]?.invoice);if(invoiceId){const invoice=await stripe.invoices.retrieve(invoiceId,{},options);subscriptionId=identifier(invoice.parent?.subscription_details?.subscription);}}
  }
 }
 if(subscriptionId)await reconcileSubscription(stripe,subscriptionId,accountId,event.id);
 return success({received:true});
}
