import type { MemberRecord } from './contracts';

export type AccountFields = { preferredName:string; firstName:string; lastName:string; biologicalSex:string; dateOfBirth:string; heightCm:string; phone:string };
export const emptyAccount:AccountFields = {preferredName:'',firstName:'',lastName:'',biologicalSex:'',dateOfBirth:'',heightCm:'',phone:''};
export function accountFields(record?:MemberRecord):AccountFields {
  return Object.fromEntries(Object.keys(emptyAccount).map(key=>[key,String(record?.data[key]??'')])) as AccountFields;
}
export function normalizeInterest(value:string) { return value.trim().replace(/^#+/,'').normalize('NFC'); }
