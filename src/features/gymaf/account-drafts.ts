import type { MemberRecord } from '@/shared/gymaf/contracts';
import { accountFields, type AccountFields } from '../../shared/gymaf/account-details';

export type AccountDraft = {fields:AccountFields; baseline:AccountFields; id:string; revision:number; commandId?:string};
const drafts=new Map<string,AccountDraft>();
export function freshAccountDraft(record?:MemberRecord):AccountDraft { const fields=accountFields(record);return {fields,baseline:fields,id:record?.id||crypto.randomUUID(),revision:record?.revision||0}; }
export const getAccountDraft=(id:string)=>drafts.get(id);
export const putAccountDraft=(id:string,draft:AccountDraft)=>drafts.set(id,draft);
export const forgetAccountDraft=(id:string)=>drafts.delete(id);
export const clearAccountDrafts=()=>drafts.clear();
export const accountChanged=(draft:AccountDraft)=>JSON.stringify(draft.fields)!==JSON.stringify(draft.baseline);
