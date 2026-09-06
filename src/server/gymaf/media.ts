import type { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { dateOnly, uuid } from '@/shared/gymaf/validation';
import type { MemberMedia } from '@/shared/gymaf/contracts';
import { config, HttpError, rpc, success } from './http';
import { mediaCommandId, normalizePhoto, PhotoInputError } from './media-image';

const bucket='gymaf-member-media';
async function stored(token:string,name:string,method='GET',body?:Uint8Array){
  const c=config();
  try{return await fetch(`${c.url}/storage/v1/object/${method==='GET'?'authenticated/':''}${bucket}/${name}`,{method,headers:{apikey:c.key,Authorization:`Bearer ${token}`,'Content-Type':'image/jpeg'},body:body?new Uint8Array(body):undefined,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});}
  catch{throw new HttpError(503,'UPLOAD_UNAVAILABLE','The photo operation could not be confirmed. Retry without changing the selected file.');}
}
async function photoRow(token:string,id:string){return await rpc('gymaf_media_query',{p_id:id},token) as MemberMedia & {object_name:string;content_hash:string;state:string};}
async function mediaCommand(token:string,action:string,payload:Record<string,unknown>){return rpc('gymaf_media_command',{p_action:action,p_command_id:mediaCommandId(String(payload.id),action),p:payload},token);}
export async function uploadMedia(request:NextRequest,token:string){
  const id=uuid(request.headers.get('idempotency-key')),kind=request.nextUrl.searchParams.get('kind'),view=request.nextUrl.searchParams.get('view'),date=dateOnly(request.nextUrl.searchParams.get('date'));
  if(!['avatar','cover','progress'].includes(kind||'')||!['front','back','side','image'].includes(view||''))throw new HttpError(422,'INVALID_PHOTO','Choose a valid photo type.');
  const reader=request.body?.getReader();if(!reader)throw new HttpError(422,'EMPTY_PHOTO','Choose a photo.');
  let length=0;const chunks:Uint8Array[]=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>4*1024*1024){await reader.cancel();throw new HttpError(413,'PHOTO_TOO_LARGE','Choose a photo smaller than 4 MB.');}chunks.push(value);}}finally{reader.releaseLock();}
  const input=new Uint8Array(length);let offset=0;for(const chunk of chunks){input.set(chunk,offset);offset+=chunk.length;}
  let normalized:Awaited<ReturnType<typeof normalizePhoto>>;
  try{normalized=await normalizePhoto(input);}catch(error){if(error instanceof PhotoInputError)throw new HttpError(422,'INVALID_PHOTO',error.message);throw error;}
  await mediaCommand(token,'media.reserve',{id,kind,view,date,contentHash:normalized.hash});
  const row=await photoRow(token,id);
  if(row.state==='removed')throw new HttpError(409,'PHOTO_REMOVED','This upload was removed. Choose the file again to create a new photo.');
  if(row.state!=='ready'){
    const response=await stored(token,row.object_name,'POST',normalized.image);
    if(!response.ok){
      // A lost response may leave the immutable object already uploaded. Verify bytes before completing.
      const existing=await stored(token,row.object_name);
      if(!existing.ok||createHash('sha256').update(new Uint8Array(await existing.arrayBuffer())).digest('hex')!==normalized.hash)
        throw new HttpError(503,'UPLOAD_UNAVAILABLE','The photo upload could not be confirmed. Retry with the same file.');
    }
    await mediaCommand(token,'media.complete',{id});
  }
  return success({id});
}
export async function readMedia(token:string,id:string){
  const row=await photoRow(token,id);if(row.state!=='ready')throw new HttpError(404,'PHOTO_UNAVAILABLE','Photo unavailable.');
  const response=await stored(token,row.object_name);if(!response.ok)throw new HttpError(404,'PHOTO_UNAVAILABLE','Photo unavailable.');
  return new Response(response.body,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; sandbox"}});
}
export async function deleteMedia(token:string,id:string){
  const row=await photoRow(token,id);
  if(row.state!=='removed'){
    const c=config();let response:Response;
    try{response=await fetch(`${c.url}/storage/v1/object/${bucket}`,{method:'DELETE',headers:{apikey:c.key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[row.object_name]}),cache:'no-store',signal:AbortSignal.timeout(20000)});}catch{throw new HttpError(503,'DELETE_UNAVAILABLE','Removal could not be confirmed. Please retry.');}
    if(!response.ok)throw new HttpError(503,'DELETE_UNAVAILABLE','Removal could not be confirmed. Please retry.');
    await mediaCommand(token,'media.remove',{id});
  }
  return success({id});
}
