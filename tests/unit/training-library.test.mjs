import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateCommand, InputError } from '../../src/shared/gymaf/validation.ts';
test('favorites require a real scheduled identity, boolean and revision, with no owner override',()=>{
  const base={action:'training.favorite',commandId:randomUUID(),payload:{scheduledId:randomUUID(),favorite:true,revision:0}};
  assert.deepEqual(validateCommand(base),base);
  for(const patch of [{favorite:null},{favorite:'true'},{revision:-1},{revision:1.5},{scheduledId:'mock-workout'},{userId:randomUUID()}])assert.throws(()=>validateCommand({...base,payload:{...base.payload,...patch}}),InputError);
});
