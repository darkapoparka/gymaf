import type { ShippingFields } from '@/shared/gymaf/shipping-address';
export type ShippingDraft={id:string;fields:ShippingFields;baseline:ShippingFields;revision:number;commandId?:string;deleteCommandId?:string};
const drafts=new Map<string,ShippingDraft>();
export const getShippingDraft=(owner:string)=>drafts.get(owner);
export const putShippingDraft=(owner:string,draft:ShippingDraft)=>drafts.set(owner,draft);
export const forgetShippingDraft=(owner:string)=>drafts.delete(owner);
export const clearShippingDrafts=()=>drafts.clear();
export const shippingChanged=(draft:ShippingDraft)=>JSON.stringify(draft.fields)!==JSON.stringify(draft.baseline);
