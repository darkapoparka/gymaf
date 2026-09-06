import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCommand } from '../../src/shared/gymaf/validation.ts';
import { normalizeInterest, emptyAccount } from '../../src/shared/gymaf/account-details.ts';
const commandId='aa000000-0000-4000-8000-000000000001';
const profile={displayName:'Synthetic',locale:'en',timezone:'Europe/Sofia',goal:'',equipment:'',availability:'',revision:1};
const save=data=>validateCommand({action:'member.save',commandId,payload:{id:commandId,kind:'account',revision:0,data}});
test('account optional fields validate dates, ranges, names and contact phone without auth claims',()=>{
 assert.deepEqual(save(emptyAccount).payload.data,emptyAccount);
 assert.equal(save({...emptyAccount,heightCm:'172.5',dateOfBirth:'1998-02-18',phone:'+359 888 123 456'}).payload.data.heightCm,'172.5');
 for(const data of [{dateOfBirth:'2026-02-31'},{dateOfBirth:'2099-01-01'},{heightCm:'Infinity'},{heightCm:'20'},{heightCm:'172.55'},{phone:'call me'},{biologicalSex:'other'},{firstName:'x'.repeat(121)},{userId:commandId},{email:'new@example.com'}])assert.throws(()=>save({...emptyAccount,...data}));
});
test('interests accept Unicode and reject duplicate tags, invalid values and excess entries',()=>{
 const run=interests=>validateCommand({action:'profile.save',commandId,payload:{...profile,interests}});
 assert.equal(normalizeInterest('  #бягане  '),'бягане');
 assert.deepEqual(run(['бягане','Trail-running']).payload.interests,['бягане','Trail-running']);
 for(const value of [['Running','running'],[''],['<script>'],['#run'],['a'.repeat(41)],Array.from({length:21},(_,i)=>'tag'+i),null])assert.throws(()=>run(value));
 const legacy=validateCommand({action:'profile.save',commandId,payload:profile});assert.equal('interests' in legacy.payload,false);
});
test('removing and re-adding the same profile interests restores a clean draft',async()=>{
 const {freshProfileDraft,profileChanged}=await import('../../src/features/gymaf/profile-drafts.ts');
 const draft=freshProfileDraft({id:commandId,display_name:'Synthetic',locale:'en',timezone:'UTC',goal:'',equipment:'',availability:'',revision:1,interests:['running']});
 assert.equal(profileChanged({...draft,fields:{...draft.fields,interests:[]}}),true);
 assert.equal(profileChanged({...draft,fields:{...draft.fields,interests:['running']}}),false);
});
