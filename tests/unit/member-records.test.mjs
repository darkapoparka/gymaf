import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateCommand, InputError } from '../../src/shared/gymaf/validation.ts';
const save = (kind,data,extra={}) => ({action:'member.save',commandId:randomUUID(),payload:{id:randomUUID(),kind,revision:0,data,...extra}});
test('member records retain real dates, structured units and empty equipment',()=>{
  assert.equal(validateCommand(save('weight',{date:'2026-09-06',valueKg:75.25})).payload.data.valueKg,75.25);
  assert.deepEqual(validateCommand(save('location',{name:'Home',type:'Home',equipment:[]})).payload.data.equipment,[]);
});
test('member records reject owner overrides, malformed dates, low weights and duplicate equipment',()=>{
  for(const input of [save('weight',{date:'2026-02-31',valueKg:75}),save('weight',{date:'2026-09-06',valueKg:0}),save('weight',{date:'2026-09-06',valueKg:NaN}),save('weight',{date:'2026-09-06',valueKg:75},{userId:randomUUID()}),save('location',{name:'Home',type:'Home',equipment:['Barbell','Barbell']}),save('event',{name:'Trip',type:'Travel',details:'',startDate:'2026-09-07',endDate:'2026-09-06',training:'Normal'})]) assert.throws(()=>validateCommand(input),InputError);
});
test('preferences are complete, strictly typed and cannot store arbitrary authority flags',()=>{
  const prefs={units:'Imperial',privateProfile:true,instructions:'Periodic',tone:'Beep',countdown:true,vibration:false};
  assert.deepEqual(validateCommand(save('preferences',prefs)).payload.data,prefs);
  assert.throws(()=>validateCommand(save('preferences',{...prefs,isCoach:true})),InputError);
  assert.throws(()=>validateCommand(save('preferences',{...prefs,privateProfile:'true'})),InputError);
});

test('events retain notes and reject missing dates, null enums and oversized details',()=>{
 const data={name:'Trip',type:'Travel',details:'Away for a week',startDate:'2026-09-07',endDate:'2026-09-14',training:'Normal'};
 assert.deepEqual(validateCommand(save('event',data)).payload.data,data);
 for(const patch of [{type:null},{startDate:null},{details:'x'.repeat(2001)},{training:null}])assert.throws(()=>validateCommand(save('event',{...data,...patch})),InputError);
});
