import type { MemberMedia } from '@/shared/gymaf/contracts';
export type PhotoSelection={id:string;file:File;saved:boolean};
export type PhotoDraft={date:string;uploadDate?:string;photos:Partial<Record<MemberMedia['view'],PhotoSelection>>};
// Document-lifetime recovery for browser Back/Forward. No private files in persistent browser storage.
const drafts=new Map<string,PhotoDraft>();
export function getPhotoDraft(key:string){return drafts.get(key);}
export function putPhotoDraft(key:string,draft:PhotoDraft){drafts.set(key,draft);}
export function forgetPhotoDraft(key:string){drafts.delete(key);}
export function clearPhotoDrafts(){drafts.clear();}
