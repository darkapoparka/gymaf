export type AttachmentDraft={id:string;file:File;uploaded:boolean};
const drafts=new Map<string,AttachmentDraft>();
export const getAttachmentDraft=(key:string)=>drafts.get(key);
export const putAttachmentDraft=(key:string,value:AttachmentDraft)=>drafts.set(key,value);
export const forgetAttachmentDraft=(key:string)=>drafts.delete(key);
export const clearAttachmentDrafts=()=>drafts.clear();
