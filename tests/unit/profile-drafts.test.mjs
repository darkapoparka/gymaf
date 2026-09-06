import test from 'node:test';
import assert from 'node:assert/strict';
import { freshProfileDraft, profileChanged, getProfileDraft, putProfileDraft, forgetProfileDraft, clearProfileDrafts } from '../../src/features/gymaf/profile-drafts.ts';
const user={id:'member-a',display_name:'Alex Smith',locale:'en',timezone:'Europe/Sofia',goal:'Strength',equipment:'Mat',availability:'Monday',revision:4};
test('profile history draft retains original revision and retry ID across account refresh',()=>{
  const draft=freshProfileDraft(user);
  assert.equal(profileChanged(draft),false);
  const edited={...draft,fields:{...draft.fields,displayName:'Alex'},commandId:'retry-command'};
  putProfileDraft(user.id,edited);
  assert.equal(profileChanged(edited),true);
  const refreshedUser={...user,revision:9};
  const restored=getProfileDraft(user.id)||freshProfileDraft(refreshedUser);
  assert.equal(restored.revision,4);
  assert.equal(restored.commandId,'retry-command');
  assert.equal(restored.fields.displayName,'Alex');
  assert.equal(getProfileDraft('member-b'),undefined);
  forgetProfileDraft(user.id);
  assert.equal(getProfileDraft(user.id),undefined);
});
test('all profile draft fields participate in dirty detection and auth clearing',()=>{
  const draft=freshProfileDraft(user);
  for(const key of Object.keys(draft.fields))assert.equal(profileChanged({...draft,fields:{...draft.fields,[key]:'changed'}}),true,key);
  putProfileDraft('member-a',draft);putProfileDraft('member-b',draft);clearProfileDrafts();
  assert.equal(getProfileDraft('member-a'),undefined);assert.equal(getProfileDraft('member-b'),undefined);
});
