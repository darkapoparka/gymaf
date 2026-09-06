import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCommand} from '../../src/shared/gymaf/validation.ts';
const id='a1000000-0000-4000-8000-000000000001';
const run=(action,payload)=>validateCommand({action,commandId:id,payload});
test('guest creation cannot inject credits, recipient or expiry',()=>{
 const p={relationshipId:id,token:'a'.repeat(64)};assert.equal(run('guest.create',p).payload.token,p.token);
 for(const extra of [{credits:99},{userId:id},{expiresAt:'2099-01-01'},{token:'short'}])assert.throws(()=>run('guest.create',{...p,...extra}));
});
test('guest acceptance cannot set membership length or bypass one-use secret',()=>{
 assert.equal(run('guest.accept',{token:'b'.repeat(64)}).payload.token.length,64);
 assert.throws(()=>run('guest.accept',{token:'b'.repeat(64),days:365}));
 assert.throws(()=>run('guest.revoke',{id,ownerId:id}));
 assert.throws(()=>run('billing.configure',{workspaceId:id,enabled:true}));
});

test('replacing a guest link accepts only owned-pass identity and a new secret',()=>{
 assert.equal(run('guest.replace-link',{id,token:'c'.repeat(64)}).payload.id,id);
 assert.throws(()=>run('guest.replace-link',{id,token:'c'.repeat(64),credits:3}));
});
