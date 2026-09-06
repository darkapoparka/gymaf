import type { Profile } from '@/shared/gymaf/contracts';

export type ProfileFields = { displayName:string; locale:Profile['locale']; timezone:string; goal:string; equipment:string; availability:string; interests:string[] };
export type ProfileDraft = { fields:ProfileFields; baseline:ProfileFields; revision:number; commandId?:string; interestInput?:string };
const drafts = new Map<string, ProfileDraft>();
export function profileFields(user:Profile):ProfileFields {
  return {displayName:user.display_name,locale:user.locale,timezone:user.timezone,goal:user.goal,equipment:user.equipment,availability:user.availability,interests:user.interests||[]};
}
export function freshProfileDraft(user:Profile):ProfileDraft { const fields=profileFields(user);return {fields,baseline:fields,revision:user.revision}; }
export function profileChanged(draft:ProfileDraft) { return Boolean(draft.interestInput?.trim()) || JSON.stringify(draft.fields)!==JSON.stringify(draft.baseline); }
// Account-scoped, document-lifetime recovery. Never persist private profile drafts to disk.
export function getProfileDraft(id:string) { return drafts.get(id); }
export function putProfileDraft(id:string,draft:ProfileDraft) { drafts.set(id,draft); }
export function forgetProfileDraft(id:string) { drafts.delete(id); }
export function clearProfileDrafts() { drafts.clear(); }
