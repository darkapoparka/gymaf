import test from 'node:test';
import assert from 'node:assert/strict';
import { memberView, memberChanges } from '../../src/lib/backend/member-adapter.ts';
const record=(kind,id,data,revision=3)=>({kind,id,data,revision,updated_at:'2026-09-06T12:00:00Z'});
test('template member adapter has no reference fixtures and converts saved measurements consistently',()=>{
 const empty=memberView([]);assert.deepEqual(empty.locations,[]);assert.deepEqual(empty.events,[]);assert.equal(empty.weight,'');
 const records=[record('preferences','p',{units:'Imperial'}),record('weight','w',{date:'2026-09-06',valueKg:80}),record('weight-target','t',{valueKg:75})];
 const view=memberView(records);assert.equal(view.weight,'176.4');assert.equal(view.preferences.weightUnit,'lb');assert.equal(view.preferences.targetWeight,'165.3');
 const changes=memberChanges({weightHistory:[...view.weightHistory,{id:'new',date:'2026-09-07',value:'176.4'}]},view,records);
 assert.equal(changes.length,1);assert.ok(Math.abs(changes[0].payload.data.valueKg-80)<.03);assert.equal(changes[0].payload.revision,0);
});
test('editing an event preserves all event fields and emits its saved revision',()=>{
 const records=[record('event','event',{name:'Race',type:'Event',details:'A private note',startDate:'2026-10-01',endDate:'2026-10-03',training:'Lighter'},8)];
 const view=memberView(records);
 assert.deepEqual(memberChanges({events:view.events},view,records),[]);
 const changes=memberChanges({events:[{...view.events[0],name:'Updated race'}]},view,records);
 assert.deepEqual(changes,[{action:'member.save',payload:{id:'event',kind:'event',revision:8,data:{name:'Updated race',type:'Event',details:'A private note',startDate:'2026-10-01',endDate:'2026-10-03',training:'Lighter'}}}]);
});
test('deletion uses only loaded record identities and revisions',()=>{
 const records=[record('injury','mine',{description:'Discuss shoulder',affectsMovement:true,excluded:['Push-Up']},4)];
 const view=memberView(records);
 assert.deepEqual(memberChanges({injuries:[]},view,records),[{action:'member.delete',payload:{id:'mine',kind:'injury',revision:4}}]);
 assert.deepEqual(memberChanges({injuries:[]},{...view,injuries:[{id:'unloaded'}]},records),[]);
});
