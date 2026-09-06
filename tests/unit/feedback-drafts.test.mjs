import test from 'node:test';
import assert from 'node:assert/strict';
import {feedbackDraft,keepFeedbackDraft,forgetFeedbackDraft,flagDraft,keepFlagDraft,clearFeedbackDrafts} from '../../src/features/gymaf/feedback-drafts.ts';
test('history recovery keeps the original revision, separates account keys and clears on auth change',()=>{
  const record={revision:4,data:{body:'Saved'}},data={body:'Unsaved'};
  keepFeedbackDraft('owner-a:session',record,data);
  keepFlagDraft('owner-a:session:exercise',{exerciseId:'exercise',reasons:['Too Hard'],comment:'Unsent'});
  assert.equal(feedbackDraft('owner-a:session').record.revision,4);
  assert.equal(feedbackDraft('owner-a:session').data.body,'Unsaved');
  assert.equal(feedbackDraft('owner-b:session'),undefined);
  assert.equal(flagDraft('owner-b:session:exercise'),undefined);
  forgetFeedbackDraft('owner-a:session');
  assert.equal(flagDraft('owner-a:session:exercise'),undefined);
  keepFeedbackDraft('owner-a:session',record,data);
  keepFlagDraft('owner-a:session:exercise',{exerciseId:'exercise',reasons:['Too Hard'],comment:'Unsent'});
  clearFeedbackDrafts();
  assert.equal(feedbackDraft('owner-a:session'),undefined);
  assert.equal(flagDraft('owner-a:session:exercise'),undefined);
});
