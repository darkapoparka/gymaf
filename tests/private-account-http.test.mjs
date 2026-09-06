import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';

test('private account, interests and coach-rating HTTP boundaries',{timeout:45000},async()=>{
 const id='86000000-0000-4000-8000-000000000021',rid='20000000-0000-4000-8000-000000000001',calls=[];
 let deny=false,conflict=false;
 const fixture=createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;
  calls.push({path:req.url,body:body?JSON.parse(body):null});
  res.setHeader('Content-Type','application/json');const reply=(value,status=200)=>{res.statusCode=status;res.end(JSON.stringify(value));};
  if(req.url==='/auth/v1/user')return reply({id,email:'synthetic@gymaf.example',email_confirmed_at:'2026-09-06'});
  if(deny)return reply({code:'42501'},403);
  if(req.url==='/rest/v1/rpc/gymaf_query')return reply({user:{id,display_name:'Synthetic'}});
  if(req.url==='/rest/v1/rpc/gymaf_member_query')return reply([]);
  if(req.url==='/rest/v1/rpc/gymaf_directory_query')return reply({coaches:[],hasMore:false});
  if(req.url==='/rest/v1/rpc/gymaf_directory_export')return reply([]);
  if(req.url==='/rest/v1/rpc/gymaf_interests_query')return reply(['running']);
  if(req.url==='/rest/v1/rpc/gymaf_coach_rating_query')return reply({relationshipId:rid,rating:null,revision:0,canSave:true});
  if(req.url==='/rest/v1/rpc/gymaf_directory_command'||req.url==='/rest/v1/rpc/gymaf_coach_rating_command'||req.url==='/rest/v1/rpc/gymaf_member_command'||req.url==='/rest/v1/rpc/gymaf_command')return conflict?reply({code:'GY409'},400):reply({id,revision:1});
  reply({},404);
 });
 fixture.listen(0,'127.0.0.1');await once(fixture,'listening');
 const reservation=createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
 const origin=`http://127.0.0.1:${port}`,child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{windowsHide:true,stdio:'ignore',env:{...process.env,APP_ORIGIN:origin,SUPABASE_URL:`http://127.0.0.1:${fixture.address().port}`,SUPABASE_PUBLISHABLE_KEY:'fixture-public'}});
 try{
  let ready=false;for(let n=0;n<100;n++){try{ready=(await fetch(origin+'/login')).ok;}catch{}if(ready)break;await delay(100);}assert.equal(ready,true);
  const headers={Origin:origin,cookie:'gymaf-access=fixture-access','Content-Type':'application/json'};
  const publicDirectory=await fetch(origin+'/api/v1/public/directory');assert.equal(publicDirectory.status,200);assert.equal(calls.at(-1).body.p_workspace,null);assert.match(publicDirectory.headers.get('cache-control'),/no-store/);
  for(const path of ['/workspaces/'+rid+'/directory','/me/account',`/relationships/${rid}/rating`])assert.equal((await fetch(origin+'/api/v1'+path)).status,401);
  const account=await fetch(origin+'/api/v1/me/account',{headers});assert.equal(account.status,200);assert.match(account.headers.get('cache-control'),/no-store/);assert.deepEqual((await account.json()).data,{email:'synthetic@gymaf.example',records:[]});
  const me=await fetch(origin+'/api/v1/me',{headers});assert.deepEqual((await me.json()).data.user.interests,['running']);
  deny=true;assert.equal((await fetch(origin+'/api/v1/me/account',{headers})).status,403);assert.equal((await fetch(origin+`/api/v1/relationships/${rid}/rating`,{headers})).status,403);deny=false;
  const command={action:'coach-rating.save',commandId:id,payload:{relationshipId:rid,revision:0,rating:5}};
  const post=(body,originHeader=origin)=>fetch(origin+'/api/v1/commands',{method:'POST',headers:{...headers,Origin:originHeader},body:JSON.stringify(body)});
  assert.equal((await post(command,'https://wrong.example')).status,403);
  assert.equal((await post({...command,payload:{...command.payload,userId:id}})).status,422);
  assert.equal((await post(command)).status,200);assert.equal(calls.at(-1).path,'/rest/v1/rpc/gymaf_coach_rating_command');assert.equal(calls.at(-1).body.p_command_id,id);
  const directory={action:'directory.save',commandId:id,payload:{workspaceId:rid,revision:0,data:{listed:false,expertise:[],styles:[],sports:[],languages:[],experience:'',qualifications:'',loves:'',location:''}}};
  assert.equal((await post(directory)).status,200);assert.equal(calls.at(-1).path,'/rest/v1/rpc/gymaf_directory_command');assert.equal((await post({...directory,payload:{...directory.payload,userId:id}})).status,422);
  const shipping={action:'member.save',commandId:id,payload:{id,kind:'shipping',revision:0,data:{street:'Synthetic Way',apartment:'',city:'Synthetic City',region:'CA',postalCode:'00000',country:'United States',shirtSize:'L'}}};
  assert.equal((await post(shipping)).status,200);assert.equal(calls.at(-1).path,'/rest/v1/rpc/gymaf_member_command');assert.equal((await post({...shipping,payload:{...shipping.payload,data:{...shipping.payload.data,postalCode:'INVALID'}}})).status,422);
  assert.equal((await post({action:'member.delete',commandId:id,payload:{id,kind:'shipping',revision:1}})).status,200);
  conflict=true;assert.equal((await post(command)).status,409);
  assert.equal((await fetch(origin+'/design-review')).status,404);
 }finally{child.kill();await new Promise(resolve=>fixture.close(resolve));}
});
