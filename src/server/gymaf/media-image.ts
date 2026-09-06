import sharp from 'sharp';
import { createHash } from 'node:crypto';

export class PhotoInputError extends Error {}
export async function normalizePhoto(input:Uint8Array) {
  if(!input.length||input.length>4*1024*1024)throw new PhotoInputError('Choose a photo smaller than 4 MB.');
  const bytes=Buffer.from(input);
  const supported=bytes.subarray(0,3).equals(Buffer.from([255,216,255]))||bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP');
  if(!supported)throw new PhotoInputError('Choose a JPEG, PNG or WebP photo.');
  try {
    const pipeline=sharp(bytes,{limitInputPixels:25000000,autoOrient:true,failOn:'warning'});
    const metadata=await pipeline.metadata();
    if((metadata.pages||1)>1)throw new PhotoInputError('Choose a still photo.');
    // Re-encoding strips embedded location and camera metadata. Preserve the complete photograph.
    const image=await pipeline.resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality:88}).toBuffer();
    return {image,hash:createHash('sha256').update(image).digest('hex')};
  } catch(error){if(error instanceof PhotoInputError)throw error;throw new PhotoInputError('This photo could not be read. Choose another JPEG, PNG or WebP.');}
}
export function mediaCommandId(id:string,action:string){const bytes=createHash('sha256').update('gymaf-media:'+id+':'+action).digest().subarray(0,16);bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;const hex=bytes.toString('hex');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;}
