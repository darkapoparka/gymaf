// Isolated HTTP/storage fixture. Never contacts the hosted provider or sends account data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import sharp from 'sharp';

test('private photo HTTP boundaries, lost-ack upload retry and deletion recovery',{timeout:45000},async()=>{
  const id='85000000-0000-4000-8000-000000000001',other='85000000-0000-4000-8000-000000000099';
  let row,stored,posts=0,failComplete=true,failRemove=true;
  const fixture=createServer(async(req,res)=>{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);const bytes=Buffer.concat(chunks);
    const json=()=>JSON.parse(bytes.toString()||'{}');const reply=(data,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
    if(req.headers.authorization!=='Bearer fixture-access')return reply({code:'42501'},403);
    if(req.url==='/auth/v1/user')return reply({id:'fixture-user',email_confirmed_at:'2026-09-06T00:00:00Z'});
    if(req.url==='/rest/v1/rpc/gymaf_media_query'){
      const {p_id}=json();if(p_id)return row&&row.id===p_id?reply(row):reply({code:'42501'},403);
      return reply(row?.state==='ready'?[row]:[]);
    }
    if(req.url==='/rest/v1/rpc/gymaf_media_command'){
      const {p_action,p}=json();
      if(p_action==='media.reserve'){
        if(row&&row.content_hash!==p.contentHash)return reply({code:'GY409'},409);
        row ||= {id:p.id,kind:p.kind,view:p.view,taken_on:p.date,created_at:'2026-09-06T00:00:00Z',object_name:`fixture/${p.id}.jpg`,content_hash:p.contentHash,state:'pending'};
      }
      if(p_action==='media.complete'){if(failComplete){failComplete=false;return reply({},503);}row.state='ready';}
      if(p_action==='media.remove'){if(failRemove){failRemove=false;return reply({},503);}row.state='removed';}
      return reply({id:p.id});
    }
    if(req.url===`/storage/v1/object/gymaf-member-media/fixture/${id}.jpg`&&req.method==='POST'){
      posts++;assert.equal(req.headers['content-type'],'image/jpeg');if(stored)return reply({},409);stored=bytes;return reply({});
    }
    if(req.url===`/storage/v1/object/authenticated/gymaf-member-media/fixture/${id}.jpg`){
      if(!stored)return reply({},404);res.setHeader('Content-Type','image/jpeg');return res.end(stored);
    }
    if(req.url==='/storage/v1/object/gymaf-member-media'&&req.method==='DELETE'){assert.deepEqual(json(),{prefixes:[`fixture/${id}.jpg`]});stored=undefined;return reply([]);}
    return reply({},404);
  });
  fixture.listen(0,'127.0.0.1');await once(fixture,'listening');
  const reservation=createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
  const origin=`http://127.0.0.1:${port}`,child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{windowsHide:true,stdio:'ignore',env:{...process.env,APP_ORIGIN:origin,SUPABASE_URL:`http://127.0.0.1:${fixture.address().port}`,SUPABASE_PUBLISHABLE_KEY:'fixture-public'}});
  try{
    let ready=false;for(let n=0;n<100;n++){try{ready=(await fetch(origin+'/login')).ok;}catch{}if(ready)break;await delay(100);}assert.equal(ready,true);
    const headers={Origin:origin,cookie:'gymaf-access=fixture-access','Content-Type':'image/png','Idempotency-Key':id};
    const upload=origin+'/api/v1/me/media?kind=progress&view=front&date=2026-09-06';
    assert.equal((await fetch(origin+'/api/v1/me/media')).status,401);
    assert.equal((await fetch(origin+`/api/v1/me/media/${other}/file`,{headers})).status,403,'asynchronous file query errors retain their HTTP boundary');
    assert.equal((await fetch(upload,{method:'POST',headers:{...headers,Origin:'https://wrong.example'},body:'x'})).status,403);
    assert.equal((await fetch(upload,{method:'POST',headers,body:'<svg/>'})).status,422);assert.equal(posts,0);
    const source=await sharp({create:{width:16,height:24,channels:3,background:'blue'}}).png().toBuffer();
    assert.equal((await fetch(upload,{method:'POST',headers,body:source})).status,503,'unconfirmed completion does not claim success');assert.equal(posts,1);assert.equal(row.state,'pending');
    assert.equal((await fetch(upload,{method:'POST',headers,body:source})).status,200,'retry accepts matching immutable stored bytes');assert.equal(posts,2);assert.equal(row.state,'ready');
    assert.equal((await fetch(upload,{method:'POST',headers,body:source})).status,200);assert.equal(posts,2,'acknowledged upload retry does not post a duplicate object');
    const image=await fetch(origin+`/api/v1/me/media/${id}/file`,{headers});assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/jpeg');assert.equal(image.headers.get('cache-control'),'private, no-store');assert.equal(image.headers.get('x-content-type-options'),'nosniff');assert.equal((await sharp(Buffer.from(await image.arrayBuffer())).metadata()).format,'jpeg');
    const different=await sharp({create:{width:16,height:24,channels:3,background:'red'}}).png().toBuffer();assert.equal((await fetch(upload,{method:'POST',headers,body:different})).status,409,'same upload ID cannot replace bytes');
    const remove=()=>fetch(origin+`/api/v1/me/media/${id}`,{method:'DELETE',headers});
    assert.equal((await fetch(origin+`/api/v1/me/media/${id}`,{method:'DELETE',headers:{...headers,Origin:'https://wrong.example'}})).status,403);
    assert.equal((await remove()).status,503);assert.equal(stored,undefined);assert.equal(row.state,'ready');
    assert.equal((await remove()).status,200,'removal retry finalizes metadata when object already disappeared');assert.equal(row.state,'removed');
    assert.equal((await fetch(origin+`/api/v1/me/media/${id}/file`,{headers})).status,404);
  }finally{child.kill();await once(child,'exit');await new Promise(resolve=>fixture.close(resolve));}
});
