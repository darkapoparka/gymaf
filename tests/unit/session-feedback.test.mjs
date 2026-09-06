import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateCommand, InputError } from '../../src/shared/gymaf/validation.ts';
const data={rating:null,difficulty:null,body:'',flags:[]};
const save=(d=data,extra={})=>({action:'feedback.save',commandId:randomUUID(),payload:{sessionId:randomUUID(),revision:0,data:d,...extra}});
test('feedback can remain unrated and private, flags retain explicit reasons',()=>{
  assert.deepEqual(validateCommand(save()).payload.data,data);
  const d={...data,rating:5,difficulty:3,flags:[{exerciseId:randomUUID(),reasons:['Uncomfortable','Injured'],comment:'Please review'}]};
  assert.deepEqual(validateCommand(save(d)).payload.data,d);
});
test('feedback rejects malformed values, duplicate flags and owner overrides',()=>{
  const flag={exerciseId:randomUUID(),reasons:['Too Hard'],comment:''};
  for(const d of [{...data,rating:0},{...data,difficulty:3.5},{...data,body:'x'.repeat(2001)},{...data,flags:[flag,flag]},{...data,flags:[{...flag,reasons:[]}]},{...data,flags:[{...flag,reasons:['Unknown']}]},{...data,flags:[{...flag,reasons:['Too Hard','Too Hard']}]},{...data,flags:[{...flag,comment:'x'.repeat(1001)}]}])assert.throws(()=>validateCommand(save(d)),InputError);
  assert.throws(()=>validateCommand(save(data,{userId:randomUUID()})),InputError);
});
test('sending feedback references only the saved session revision',()=>{
  const c={action:'feedback.submit',commandId:randomUUID(),payload:{sessionId:randomUUID(),revision:3}};
  assert.deepEqual(validateCommand(c).payload,c.payload);
  assert.throws(()=>validateCommand({...c,payload:{...c.payload,data}}),InputError);
});
