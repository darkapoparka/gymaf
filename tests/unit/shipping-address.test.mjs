import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCommand} from '../../src/shared/gymaf/validation.ts';
import {emptyShipping,isUSAddress} from '../../src/shared/gymaf/shipping-address.ts';
import {getShippingDraft,putShippingDraft,shippingChanged,clearShippingDrafts} from '../../src/features/gymaf/shipping-drafts.ts';
const id='93000000-0000-4000-8000-000000000001',commandId='93000000-0000-4000-8000-000000000002';
const fields={...emptyShipping(),street:'Synthetic Way',city:'Synthetic City',region:'CA',postalCode:'00000',shirtSize:'L'};
test('shipping validates country-aware fields and source shirt sizes without accepting authority fields',()=>{
 const run=(data=fields,extra={})=>validateCommand({action:'member.save',commandId,payload:{id,kind:'shipping',revision:0,data,...extra}});
 assert.equal(run().payload.data.region,'CA');assert.equal(isUSAddress(' US '),true);
 assert.equal(run({...fields,country:'Bulgaria',region:'',postalCode:''}).payload.data.country,'Bulgaria');
 for(const data of [{...fields,street:''},{...fields,region:'Invalid'},{...fields,postalCode:'ABCDE'},{...fields,shirtSize:''},{...fields,shirtSize:'XXXL'},{...fields,street:'x'.repeat(201)},{...fields,country:'X'},{...fields,trackingNumber:'invented'}])assert.throws(()=>run(data));
 assert.throws(()=>run(fields,{userId:id}));
 assert.equal(validateCommand({action:'member.delete',commandId,payload:{id,kind:'shipping',revision:1}}).action,'member.delete');
});
test('shipping keeps separate save and removal retries, detects changes and clears on authentication changes',()=>{
 const draft={id,fields,baseline:emptyShipping(),revision:3,commandId,deleteCommandId:id};putShippingDraft('one',draft);
 assert.equal(shippingChanged(draft),true);assert.equal(getShippingDraft('one').revision,3);assert.equal(getShippingDraft('two'),undefined);
 assert.equal(getShippingDraft('one').deleteCommandId,id);clearShippingDrafts();assert.equal(getShippingDraft('one'),undefined);
});
