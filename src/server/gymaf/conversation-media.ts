import type { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { uuid } from '@/shared/gymaf/validation';
import { config, HttpError, rpc, success } from './http';
import { mediaCommandId, normalizePhoto, PhotoInputError } from './media-image';

const bucket='gymaf-conversation-media';
type AttachmentRow={id:string;state:string;mime_type:string;object_name:string;content_hash:string};
const row=(token:string,id:string)=>rpc('gymaf_attachment_query',{p_id:id},token) as Promise<AttachmentRow>;
const command=(token:string,action:string,p:Record<string,unknown>)=>rpc('gymaf_attachment_command',{p_action:action,p_command_id:mediaCommandId(String(p.id),action),p},token);
async function stored(token:string,name:string,method='GET',body?:Uint8Array,mime='application/octet-stream'){
 const c=config();try{return await fetch(`${c.url}/storage/v1/object/${method==='GET'?'authenticated/':''}${bucket}/${name}`,{method,headers:{apikey:c.key,Authorization:`Bearer ${token}`,'Content-Type':mime},body:body?new Uint8Array(body):undefined,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw new HttpError(503,'MEDIA_UNAVAILABLE','The media operation could not be confirmed. Retry with the same file.');}
}
export async function uploadAttachment(request:NextRequest,token:string){
 const id=uuid(request.headers.get('idempotency-key')),relationshipId=uuid(request.nextUrl.searchParams.get('relationship'));
 const sessionId=request.nextUrl.searchParams.has('session')?uuid(request.nextUrl.searchParams.get('session')):null,exerciseId=request.nextUrl.searchParams.has('exercise')?uuid(request.nextUrl.searchParams.get('exercise')):null;
 const reader=request.body?.getReader();if(!reader)throw new HttpError(422,'EMPTY_MEDIA','Choose a photo or video.');
 let size=0;const chunks:Uint8Array[]=[];
 try{for(;;){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>4194304){await reader.cancel();throw new HttpError(413,'MEDIA_TOO_LARGE','Choose a file smaller than 4 MB. Record a shorter clip.');}chunks.push(next.value);}}finally{reader.releaseLock();}
 let bytes=Buffer.concat(chunks),mime=(request.headers.get('content-type')||'').split(';')[0];
 if(mime.startsWith('image/')){try{bytes=(await normalizePhoto(bytes)).image;mime='image/jpeg';}catch(error){if(error instanceof PhotoInputError)throw new HttpError(422,'INVALID_MEDIA',error.message);throw error;}}
 else if(bytes.length<16||!((mime==='video/webm'&&bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])))||(mime==='video/mp4'&&bytes.toString('ascii',4,8)==='ftyp')))throw new HttpError(422,'INVALID_MEDIA','Choose a JPEG, PNG, WebP photo or an MP4/WebM recording.');
 const hash=createHash('sha256').update(bytes).digest('hex');
 await command(token,'attachment.reserve',{id,relationshipId,sessionId,exerciseId,mimeType:mime,contentHash:hash});
 const item=await row(token,id);if(item.state==='removed')throw new HttpError(409,'MEDIA_REMOVED','This upload was removed. Choose the file again.');
 if(item.state!=='ready'){
  const response=await stored(token,item.object_name,'POST',bytes,mime);
  if(!response.ok){const existing=await stored(token,item.object_name);if(!existing.ok||createHash('sha256').update(new Uint8Array(await existing.arrayBuffer())).digest('hex')!==hash)throw new HttpError(503,'UPLOAD_UNCONFIRMED','Upload could not be confirmed. Retry with the same file.');}
  await command(token,'attachment.complete',{id});
 }
 return success({id});
}
export async function readAttachment(token:string,id:string){
 const item=await row(token,id);if(item.state!=='ready')throw new HttpError(404,'MEDIA_UNAVAILABLE','Media unavailable.');
 const response=await stored(token,item.object_name);if(!response.ok)throw new HttpError(404,'MEDIA_UNAVAILABLE','Media unavailable.');
 return new Response(response.body,{headers:{'Content-Type':item.mime_type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; sandbox"}});
}
export async function deleteAttachment(token:string,id:string){
 const item=await row(token,id);
 if(item.state!=='removed'){
  const c=config();let response:Response;
  try{response=await fetch(`${c.url}/storage/v1/object/${bucket}`,{method:'DELETE',headers:{apikey:c.key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[item.object_name]}),cache:'no-store',signal:AbortSignal.timeout(20000)});}catch{throw new HttpError(503,'DELETE_UNCONFIRMED','Removal could not be confirmed. Retry.');}
  if(!response.ok)throw new HttpError(503,'DELETE_UNCONFIRMED','Removal could not be confirmed. Retry.');
  await command(token,'attachment.remove',{id});
 }
 return success({id});
}
