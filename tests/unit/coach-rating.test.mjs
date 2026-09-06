import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCommand} from '../../src/shared/gymaf/validation.ts';
import {freshRatingDraft,getRatingDraft,putRatingDraft,clearRatingDrafts} from '../../src/features/gymaf/rating-drafts.ts';
const relationshipId='20000000-0000-4000-8000-000000000001',commandId='91000000-0000-4000-8000-000000000001';
test('private coach rating requires an owned relationship, revision and integer1–5 without owner overrides',()=>{
 const run=payload=>validateCommand({action:'coach-rating.save',commandId,payload});
 assert.equal(run({relationshipId,revision:0,rating:5}).payload.rating,5);
 for(const rating of [0,6,null,'5',2.5])assert.throws(()=>run({relationshipId,revision:0,rating}));
 assert.throws(()=>run({relationshipId,revision:0,rating:5,userId:commandId}));
});
test('rating drafts isolate relationships and accounts and keep retry baseline until auth clearing',()=>{
 const draft={...freshRatingDraft({relationshipId,rating:2,revision:7}),rating:4,commandId};
 putRatingDraft('owner',relationshipId,draft);
 assert.equal(getRatingDraft('owner',relationshipId).revision,7);
 assert.equal(getRatingDraft('owner',relationshipId).commandId,commandId);
 assert.equal(getRatingDraft('other',relationshipId),undefined);
 assert.equal(getRatingDraft('owner','other'),undefined);
 clearRatingDrafts();assert.equal(getRatingDraft('owner',relationshipId),undefined);
});
