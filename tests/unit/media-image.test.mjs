import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { normalizePhoto, mediaCommandId, PhotoInputError } from '../../src/server/gymaf/media-image.ts';
import { getPhotoDraft,putPhotoDraft,forgetPhotoDraft,clearPhotoDrafts } from '../../src/features/gymaf/media-drafts.ts';

test('photo normalization orients, bounds and strips private EXIF metadata',async()=>{
  const source=await sharp({create:{width:2000,height:1000,channels:3,background:'#abc'}}).jpeg().withMetadata({orientation:6}).withExif({IFD0:{Artist:'Private author'},IFD2:{UserComment:'Private location'}}).toBuffer();
  const {image,hash}=await normalizePhoto(source),meta=await sharp(image).metadata();
  assert.equal(meta.format,'jpeg');assert.equal(meta.width,800);assert.equal(meta.height,1600);assert.equal(meta.exif,undefined);assert.equal(meta.orientation,undefined);assert.match(hash,/^[a-f0-9]{64}$/);
  assert.deepEqual(await normalizePhoto(source),{image,hash});
});
test('transparent PNG and WebP become still JPEG with white background',async()=>{
  for(const format of ['png','webp']){
    const source=await sharp({create:{width:24,height:12,channels:4,background:{r:0,g:0,b:0,alpha:0}}})[format]().toBuffer();
    const {image}=await normalizePhoto(source),meta=await sharp(image).metadata();
    assert.equal(meta.width,24);assert.equal(meta.height,12);assert.equal(meta.hasAlpha,false);
    const pixel=await sharp(image).raw().toBuffer();assert.deepEqual([...pixel.subarray(0,3)],[255,255,255]);
  }
});
test('photo decoder rejects oversized, empty, active content, corrupt and animated files',async()=>{
  const animated=await sharp(Buffer.from([...Array(4).fill([255,0,0]).flat(),...Array(4).fill([0,0,255]).flat()]),{raw:{width:2,height:4,channels:3,pageHeight:2}}).webp({loop:0,delay:[100,100]}).toBuffer();
  assert.equal((await sharp(animated).metadata()).pages,2);
  for(const input of [Buffer.alloc(0),Buffer.alloc(4194305),Buffer.from('<svg onload="alert(1)"/>'),Buffer.from([255,216,255,0,0]),animated])await assert.rejects(normalizePhoto(input),PhotoInputError);
});
test('idempotency keys are stable per asset and action, and isolated across assets',()=>{
  const reserve=mediaCommandId('asset-a','media.reserve');assert.match(reserve,/^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  assert.equal(reserve,mediaCommandId('asset-a','media.reserve'));assert.notEqual(reserve,mediaCommandId('asset-a','media.complete'));assert.notEqual(reserve,mediaCommandId('asset-b','media.reserve'));
});
test('private photo drafts recover per account and clear on discard or session change',()=>{
  const draft={date:'2026-09-06',photos:{front:{id:'a',file:new File(['test'],'fixture.png'),saved:false}}};
  putPhotoDraft('alice:progress',draft);assert.equal(getPhotoDraft('alice:progress'),draft);assert.equal(getPhotoDraft('bob:progress'),undefined);
  forgetPhotoDraft('alice:progress');assert.equal(getPhotoDraft('alice:progress'),undefined);
  putPhotoDraft('alice:progress',draft);clearPhotoDrafts();assert.equal(getPhotoDraft('alice:progress'),undefined);
});
