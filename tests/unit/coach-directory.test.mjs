import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCommand} from '../../src/shared/gymaf/validation.ts';
import {emptyDirectoryFilters,filterDirectory,getDirectoryFilters,putDirectoryFilters,getDirectoryDraft,putDirectoryDraft,clearDirectoryDrafts} from '../../src/features/gymaf/directory-data.ts';
const workspaceId='10000000-0000-4000-8000-000000000001',commandId='92000000-0000-4000-8000-000000000001';
const data={listed:true,expertise:['Running'],styles:['Supportive'],sports:['Running'],languages:['English'],experience:'',qualifications:'',loves:'',location:''};
test('directory commands accept approved finite metadata and reject injected owner or publishing fields',()=>{
 const run=(fields=data,extra={})=>validateCommand({action:'directory.save',commandId,payload:{workspaceId,revision:0,data:fields,...extra}});
 assert.equal(run().payload.data.listed,true);
 for(const value of [{...data,listed:'true'},{...data,expertise:['Invented']},{...data,styles:['Supportive','Supportive']},{...data,qualifications:'x'.repeat(1001)},{...data,published:true}])assert.throws(()=>run(value));
 assert.throws(()=>run(data,{ownerId:commandId}));
});
test('directory filters combine alternatives within a category and requirements across categories',()=>{
 const coaches=[{workspaceId,slug:'z',name:'Zoe',bio:'Power',details:{...data,expertise:['Powerlifting'],languages:['Bulgarian']}},{workspaceId:commandId,slug:'a',name:'Alex',bio:'Track training',details:data}];
 const filters=emptyDirectoryFilters();
 assert.deepEqual(filterDirectory(coaches,filters).map(c=>c.name),['Alex','Zoe']);
 filters.expertise=['Powerlifting','Running'];filters.languages=['English'];assert.deepEqual(filterDirectory(coaches,filters).map(c=>c.name),['Alex']);
 filters.search='  TRACK ';assert.equal(filterDirectory(coaches,filters).length,1);
 filters.search='missing';assert.equal(filterDirectory(coaches,filters).length,0);
});
test('directory filters and unsaved profile are scoped by account and clear with authentication',()=>{
 const filters={...emptyDirectoryFilters(),reasons:['Ready for something new']},draft={data,baseline:{...data,listed:false},revision:7,commandId};
 putDirectoryFilters('one',filters);putDirectoryDraft('one',workspaceId,draft);
 assert.deepEqual(getDirectoryFilters('one').reasons,filters.reasons);assert.deepEqual(getDirectoryFilters('two').reasons,[]);
 assert.equal(getDirectoryDraft('two',workspaceId),undefined);assert.equal(getDirectoryDraft('one','other'),undefined);assert.equal(getDirectoryDraft('one',workspaceId).commandId,commandId);
 clearDirectoryDrafts();assert.equal(getDirectoryDraft('one',workspaceId),undefined);assert.deepEqual(getDirectoryFilters('one').reasons,[]);
});
