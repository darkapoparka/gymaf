"use client";
import { useEffect, useRef, useState } from 'react';
import type { DirectoryFields, DirectoryProfile } from '@/shared/gymaf/contracts';
import { coachExpertise, coachStyles, coachSports, coachLanguages, validateCommand } from '@/shared/gymaf/validation';
import { api } from './api';
import { Dialog, Pending, useResource } from './ui';
import { EditorError, editorError } from './editor-error';
import { forgetDirectoryDraft, getDirectoryDraft, putDirectoryDraft, type DirectoryDraft } from './directory-data';

export function DirectoryEditor({ownerId,workspaceId}:{ownerId:string;workspaceId:string}) {
  const resource=useResource<DirectoryProfile>(`workspaces/${workspaceId}/directory`);
  if(!resource.data)return <Pending error={resource.error} reload={resource.reload}/>;
  return <Editor key={`${ownerId}:${workspaceId}`} ownerId={ownerId} profile={resource.data}/>;
}
const fresh=(profile:DirectoryProfile):DirectoryDraft=>({data:profile.data,baseline:profile.data,revision:profile.revision});
function Editor({ownerId,profile}:{ownerId:string;profile:DirectoryProfile}) {
  const [draft,setDraft]=useState(()=>getDirectoryDraft(ownerId,profile.workspaceId)||fresh(profile));
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[reloadOpen,setReloadOpen]=useState(false);
  const running=useRef(false),mounted=useRef(true),controller=useRef<AbortController|null>(null);
  const dirty=JSON.stringify(draft.data)!==JSON.stringify(draft.baseline),endpoint=`workspaces/${profile.workspaceId}/directory`;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
  useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  function update(next:DirectoryDraft){putDirectoryDraft(ownerId,profile.workspaceId,next);setDraft(next);setNotice('');}
  function change<K extends keyof DirectoryFields>(key:K,value:DirectoryFields[K]){update({...draft,data:{...draft.data,[key]:value},commandId:undefined});}
  async function save(){
    if(running.current||!dirty)return;running.current=true;setBusy(true);setError('');controller.current=new AbortController();
    const next={...draft,commandId:draft.commandId||crypto.randomUUID()};update(next);
    try{
      const command=validateCommand({action:'directory.save',commandId:next.commandId,payload:{workspaceId:profile.workspaceId,data:next.data,revision:next.revision}});
      const result=await api<{revision:number}>('commands',{method:'POST',body:command,signal:controller.current.signal});
      if(mounted.current){forgetDirectoryDraft(ownerId,profile.workspaceId);setDraft({data:next.data,baseline:next.data,revision:result.revision});setNotice(next.data.listed?'Directory settings saved. Your profile appears while your coach page is published.':'Directory settings saved. Your profile is not listed.');}
    }catch(failure){if(mounted.current)setError(editorError(failure,'save your directory profile'));}
    finally{running.current=false;if(mounted.current)setBusy(false);}
  }
  async function reload(){
    if(running.current)return;running.current=true;setBusy(true);setError('');controller.current=new AbortController();
    try{const saved=await api<DirectoryProfile>(endpoint,{signal:controller.current.signal});if(mounted.current){forgetDirectoryDraft(ownerId,profile.workspaceId);setDraft(fresh(saved));setReloadOpen(false);setNotice('Saved directory profile loaded.');}}
    catch(failure){if(mounted.current)setError(editorError(failure,'load your directory profile'));}
    finally{running.current=false;if(mounted.current)setBusy(false);}
  }
  return <section className="gymaf-panel gymaf-stack directory-editor" aria-busy={busy}><h2>Coach directory</h2><p>Add details you approve for public browsing. Your published coach page supplies your name and biography.</p>
    <form className="gymaf-stack" onSubmit={event=>{event.preventDefault();void save();}}><fieldset className="gymaf-stack" disabled={busy}>
      <label className="directory-opt-in"><input type="checkbox" checked={draft.data.listed} onChange={event=>change('listed',event.target.checked)}/><span>List my published profile in the coach directory</span></label>
      {([['expertise','Expertise',coachExpertise],['styles','Coaching style',coachStyles],['sports','Sports',coachSports],['languages','Languages',coachLanguages]] as const).map(([key,label,choices])=><fieldset key={key}><legend>{label}</legend><div className="directory-editor-options">{choices.map(value=><label key={value}><input type="checkbox" checked={draft.data[key].includes(value)} onChange={()=>change(key,draft.data[key].includes(value)?draft.data[key].filter(item=>item!==value):[...draft.data[key],value])}/><span>{value}</span></label>)}</div></fieldset>)}
      {([['experience','Experience',500],['qualifications','Qualifications',1000],['loves','Loves',500],['location','Location',120]] as const).map(([key,label,max])=><label className="form-field" key={key}>{label}<textarea maxLength={max} value={draft.data[key]} onChange={event=>change(key,event.target.value)}/></label>)}
      <p className="note">Only share details you want everyone to read. Listing does not add appointment availability, accept payment, or promise credentials have been verified.</p>
      <EditorError message={error}/><button className="button primary" disabled={!dirty||busy}>{busy?'Saving…':'Save Directory Profile'}</button><button className="button" type="button" onClick={()=>{if(dirty)setReloadOpen(true);else void reload();}}>Reload Saved Profile</button>
    </fieldset></form>{notice&&<p role="status">{notice}</p>}
    {reloadOpen&&<Dialog title="Reload directory profile?" onClose={()=>{if(!busy)setReloadOpen(false);}}><p>Reloading replaces your unsaved edits with the saved profile.</p><EditorError message={error}/><button className="button primary" disabled={busy} onClick={()=>setReloadOpen(false)}>Keep Editing</button><button className="button" disabled={busy} onClick={()=>void reload()}>Discard Changes and Reload</button></Dialog>}
  </section>;
}
