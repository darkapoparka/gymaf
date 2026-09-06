import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCommand} from '../../src/shared/gymaf/validation.ts';
import {getAttachmentDraft,putAttachmentDraft,clearAttachmentDrafts} from '../../src/features/gymaf/attachment-drafts.ts';
const id='98000000-0000-4000-8000-000000000001';
const run=(action,payload)=>validateCommand({action,commandId:id,payload});
test('booking requires zoned bounded instants and rejects member ownership injection',()=>{
 const slot={workspaceId:id,startsAt:'2026-10-01T10:00:00+03:00',endsAt:'2026-10-01T10:30:00+03:00',cancelMinutes:60};
 assert.equal(run('booking.slot-create',slot).payload.startsAt,'2026-10-01T07:00:00.000Z');
 for(const extra of [{startsAt:'2026-10-01T10:00:00'},{endsAt:slot.startsAt},{endsAt:'2026-10-02T10:00:00Z'},{cancelMinutes:-1},{memberId:id}])assert.throws(()=>run('booking.slot-create',{...slot,...extra}));
 assert.throws(()=>run('booking.reserve',{id,memberId:id}));
});
test('friend secrets have exact entropy encoding and cannot inject sharing fields',()=>{
 assert.equal(run('social.accept',{token:'a'.repeat(64)}).payload.token.length,64);
 for(const token of ['a'.repeat(63),'z'.repeat(64),'a'.repeat(65)])assert.throws(()=>run('social.accept',{token}));
 assert.throws(()=>run('social.invite',{token:'a'.repeat(64),credits:3}));
});
test('attachment publishing accepts only the owned identifier; internal lifecycle commands are not browser commands',()=>{
 assert.equal(run('attachment.share',{id}).payload.id,id);
 assert.throws(()=>run('attachment.share',{id,relationshipId:id}));
 assert.throws(()=>run('attachment.complete',{id}));
});
test('selected attachment drafts stay account scoped and clear at authentication boundaries',()=>{
 const draft={id,file:new File(['synthetic'],'test.webm',{type:'video/webm'}),uploaded:true};
 putAttachmentDraft('one:relationship',draft);assert.equal(getAttachmentDraft('one:relationship').id,id);assert.equal(getAttachmentDraft('two:relationship'),undefined);
 clearAttachmentDrafts();assert.equal(getAttachmentDraft('one:relationship'),undefined);
});
