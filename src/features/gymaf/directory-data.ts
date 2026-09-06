import type { DirectoryCoach, DirectoryFields } from '@/shared/gymaf/contracts';
export type DirectoryFilters={expertise:string[];styles:string[];sports:string[];languages:string[];search:string;sort:'Default order'|'A–Z';expanded:boolean;reasons:string[]};
export const emptyDirectoryFilters=():DirectoryFilters=>({expertise:[],styles:[],sports:[],languages:[],search:'',sort:'Default order',expanded:false,reasons:[]});
const filters=new Map<string,DirectoryFilters>();
export const getDirectoryFilters=(owner:string)=>filters.get(owner)||emptyDirectoryFilters();
export const putDirectoryFilters=(owner:string,value:DirectoryFilters)=>filters.set(owner,value);
export const clearDirectoryDrafts=()=>{filters.clear();editorDrafts.clear();};
export function filterDirectory(coaches:DirectoryCoach[],filters:DirectoryFilters){
  const search=filters.search.trim().toLocaleLowerCase();
  return coaches.filter(coach=>(!search||`${coach.name} ${coach.bio} ${coach.details.experience}`.toLocaleLowerCase().includes(search))&&(['expertise','styles','sports','languages'] as const).every(key=>!filters[key].length||filters[key].some(value=>coach.details[key].includes(value)))).sort((a,b)=>a.name.localeCompare(b.name)||a.slug.localeCompare(b.slug));
}
export type DirectoryDraft={data:DirectoryFields;baseline:DirectoryFields;revision:number;commandId?:string};
const editorDrafts=new Map<string,DirectoryDraft>();
export const getDirectoryDraft=(owner:string,workspace:string)=>editorDrafts.get(`${owner}:${workspace}`);
export const putDirectoryDraft=(owner:string,workspace:string,draft:DirectoryDraft)=>editorDrafts.set(`${owner}:${workspace}`,draft);
export const forgetDirectoryDraft=(owner:string,workspace:string)=>editorDrafts.delete(`${owner}:${workspace}`);
