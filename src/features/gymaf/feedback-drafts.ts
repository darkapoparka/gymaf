import type { ExerciseFlag, FeedbackData, SessionFeedback } from '@/shared/gymaf/contracts';

// Recovery within this JavaScript document only. Never a server acknowledgement or a disk cache.
// Keeping the original revision makes returning to a stale draft conflict safely.
const drafts = new Map<string, { record: SessionFeedback; data: FeedbackData }>();
const flags = new Map<string, ExerciseFlag>();
export function feedbackDraft(key: string) { return drafts.get(key); }
export function keepFeedbackDraft(key: string, record: SessionFeedback, data: FeedbackData) { drafts.set(key, {record, data}); }
export function forgetFeedbackDraft(key: string) { drafts.delete(key); for(const flagKey of flags.keys())if(flagKey.startsWith(key+':'))flags.delete(flagKey); }
export function flagDraft(key: string) { return flags.get(key); }
export function keepFlagDraft(key: string, flag: ExerciseFlag) { flags.set(key, flag); }
export function forgetFlagDraft(key: string) {
  flags.delete(key);
  const parent=key.slice(0,key.lastIndexOf(':')),draft=drafts.get(parent);
  if(draft&&JSON.stringify(draft.data)===JSON.stringify(draft.record.data)&&![...flags.keys()].some(k=>k.startsWith(parent+':')))drafts.delete(parent);
}
export function clearFeedbackDrafts() { drafts.clear(); flags.clear(); }
