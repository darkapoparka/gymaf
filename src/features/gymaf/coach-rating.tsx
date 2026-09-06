"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import type { CoachRating } from '@/shared/gymaf/contracts';
import { validateCommand } from '@/shared/gymaf/validation';
import { api } from './api';
import { Dialog, ErrorNote, useResource } from './ui';
import { EditorError, editorError } from './editor-error';
import { InitialAvatar } from './client-views';
import { requestRatingFocus, forgetRatingDraft, freshRatingDraft, getRatingDraft, putRatingDraft, type RatingDraft } from './rating-drafts';

export function CoachRatingDialog({ownerId,relationshipId,coachName}:{ownerId:string;relationshipId:string;coachName:string}) {
  const router=useRouter(),resource=useResource<CoachRating>(`relationships/${relationshipId}/rating`);
  const close=()=>{requestRatingFocus(ownerId,relationshipId);router.replace(`/app/messages?relationship=${relationshipId}`);};
  if(!resource.data)return <Dialog title="Your coach rating" onClose={close}><ErrorNote message={resource.error}/>{resource.error?<button className="button" onClick={resource.reload}>Retry</button>:<p role="status">Loading your rating…</p>}</Dialog>;
  return <CoachRatingView key={`${ownerId}:${relationshipId}`} saved={resource.data} ownerId={ownerId} coachName={coachName} onClose={close}/>;
}
function CoachRatingView({saved,ownerId,coachName,onClose}:{saved:CoachRating;ownerId:string;coachName:string;onClose:()=>void}) {
  const id=saved.relationshipId;
  const [draft,setDraft]=useState(()=>getRatingDraft(ownerId,id)||freshRatingDraft(saved));
  const [canSave,setCanSave]=useState(saved.canSave);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[choice,setChoice]=useState<'leave'|'reload'|null>(null);
  const running=useRef(false),mounted=useRef(true),controller=useRef<AbortController|null>(null),dirty=draft.rating!==draft.baseline;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
  useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  function update(value:RatingDraft){putRatingDraft(ownerId,id,value);setDraft(value);}
  function close(){if(running.current)return;if(dirty)setChoice('leave');else{forgetRatingDraft(ownerId,id);onClose();}}
  async function save(){
    if(running.current||!draft.rating||!canSave)return;
    running.current=true;setBusy(true);setError('');controller.current=new AbortController();
    const next={...draft,commandId:draft.commandId||crypto.randomUUID()};update(next);
    try{await api('commands',{method:'POST',body:validateCommand({action:'coach-rating.save',commandId:next.commandId,payload:{relationshipId:id,revision:next.revision,rating:next.rating}}),signal:controller.current.signal});if(mounted.current){forgetRatingDraft(ownerId,id);onClose();}}
    catch(failure){if(mounted.current)setError(editorError(failure,'save your private rating'));}
    finally{running.current=false;if(mounted.current)setBusy(false);}
  }
  async function reload(){
    if(running.current)return;running.current=true;setBusy(true);setError('');controller.current=new AbortController();
    try{const current=await api<CoachRating>(`relationships/${id}/rating`,{signal:controller.current.signal});if(mounted.current){forgetRatingDraft(ownerId,id);setDraft(freshRatingDraft(current));setCanSave(current.canSave);setChoice(null);}}
    catch(failure){if(mounted.current)setError(editorError(failure,'load your saved rating'));}
    finally{running.current=false;if(mounted.current)setBusy(false);}
  }
  return <Dialog title={`How is it going with ${coachName}?`} className="connected-coach-rating" onClose={close} decoration={<div className="coach-rating-avatar"><InitialAvatar name={coachName} size={96}/></div>}>
    <p>You can return here to update your rating. Your response is private and will not be shared with your coach.</p>
    <div className="coach-rating-stars" role="group" aria-label="Rate your coach">{[1,2,3,4,5].map(value=><button type="button" key={value} aria-label={`Rate coach ${value} out of 5`} aria-pressed={draft.rating===value} disabled={busy||!canSave} onClick={()=>{if(draft.rating!==value)update({...draft,rating:value,commandId:undefined});}}><Star fill="currentColor" strokeWidth={0} className={value<=(draft.rating||0)?'selected':''}/></button>)}</div>
    <EditorError message={error}/>
    {!canSave&&<p className="note">Your saved rating remains private. This coaching relationship is not open for new ratings.</p>}
    {choice?<div className="rating-exit"><p>{choice==='leave'?'Keep your changes to this rating?':'Replace your changes with the saved rating?'}</p><button autoFocus className="button full" disabled={busy} onClick={()=>setChoice(null)}>Keep Editing</button>{choice==='leave'&&<button className="button primary full" disabled={busy||!draft.rating||!canSave} onClick={()=>void save()}>Save and Close</button>}<button className="button full" disabled={busy} onClick={()=>{if(choice==='reload')void reload();else{forgetRatingDraft(ownerId,id);onClose();}}}>{choice==='reload'?'Discard Changes and Reload':'Discard and Close'}</button></div>:<><button className="coach-rating-submit" disabled={busy||!draft.rating||!canSave||(!dirty&&saved.rating!==null)} onClick={()=>void save()}>{busy?'Saving…':!dirty&&saved.rating!==null?'Rating Saved':'Submit'}</button>{error&&<button className="button full" disabled={busy} onClick={()=>setChoice('reload')}>Reload Saved Rating</button>}</>}
  </Dialog>;
}
