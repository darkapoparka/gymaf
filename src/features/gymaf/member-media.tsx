"use client";
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Camera, Check, ChevronLeft, Images, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CameraCapture } from './camera-capture';
import type { Bootstrap, MemberMedia, RelationshipDetail } from '@/shared/gymaf/contracts';
import { localDate } from '@/shared/gymaf/validation';
import { api } from './api';
import { Dialog, ErrorNote, Pending, useResource } from './ui';
import { ProfileOverview } from './client-views';
import { forgetPhotoDraft, getPhotoDraft, putPhotoDraft, type PhotoDraft } from './media-drafts';

const labels={front:'Full Body - Front',back:'Full Body - Back',side:'Full Body - Side',image:'Photo'};
type Kind=MemberMedia['kind'];
function description(item:MemberMedia){return `${item.kind==='progress'?labels[item.view]:item.kind==='cover'?'Cover photo':'Profile photo'}, ${item.taken_on}`;}
export function PrivatePhoto({item,className=''}:{item:MemberMedia;className?:string}){
  const [state,setState]=useState<{id:string;src?:string;error?:string}>({id:item.id}),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();let url:string|undefined;
    void api<Blob>(`me/media/${item.id}/file`,{responseType:'blob',signal:controller.signal}).then(blob=>{
      if(controller.signal.aborted)return;url=URL.createObjectURL(blob);setState({id:item.id,src:url});
    }).catch(()=>{if(!controller.signal.aborted)setState({id:item.id,error:'Photo unavailable'});});
    return()=>{controller.abort();if(url)URL.revokeObjectURL(url);};
  },[item.id,attempt]);
  if(state.id===item.id&&state.src)return <img className={className} src={state.src} alt={description(item)}/>; // eslint-disable-line @next/next/no-img-element -- Private, authenticated blob; never sent through the image optimizer.
  return <span className={`private-photo-placeholder ${className}`} role={state.error?undefined:'img'} aria-label={state.error?undefined:'Loading photo'}>{state.error?<button type="button" aria-label={`Photo unavailable. Retry ${description(item)}`} onClick={e=>{e.stopPropagation();setState({id:item.id});setAttempt(n=>n+1);}}>Retry<br/>Photo</button>:<Camera aria-hidden="true"/>}</span>;
}
export function SelectedPhoto({file}:{file:File}){
  const ref=useRef<HTMLImageElement>(null);
  useEffect(()=>{const url=URL.createObjectURL(file);if(ref.current)ref.current.src=url;return()=>URL.revokeObjectURL(url);},[file]);
  return <img ref={ref} alt="Selected photo preview"/>; // eslint-disable-line @next/next/no-img-element -- Document-scoped file preview.
}
export function PhotoEntry({kind,draftKey,today,onClose,onUpload,onSaved}:{kind:Kind;draftKey:string;today:string;onClose:()=>void;onUpload:(file:File,id:string,view:MemberMedia['view'],date:string,signal:AbortSignal)=>Promise<void>;onSaved:(id:string)=>void}){
  const [draft,setDraft]=useState<PhotoDraft>(()=>getPhotoDraft(draftKey)||{date:today,photos:{}}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[discard,setDiscard]=useState(false);
  const running=useRef(false),controller=useRef<AbortController|null>(null),mounted=useRef(true);
  const [source,setSource]=useState<MemberMedia['view']|null>(null);
  const [camera,setCamera]=useState<MemberMedia['view']|null>(null);
  const views:MemberMedia['view'][]=kind==='progress'?['front','back','side']:['image'];
  const dirty=Object.values(draft.photos).some(photo=>!photo?.saved);
  function update(next:PhotoDraft){putPhotoDraft(draftKey,next);setDraft(next);}
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
  useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  function close(){if(running.current)return;if(dirty)setDiscard(true);else{forgetPhotoDraft(draftKey);onClose();}}
  async function save(){
    if(running.current||!dirty)return;running.current=true;setBusy(true);setError('');controller.current=new AbortController();
    let next={...draft,uploadDate:draft.uploadDate||draft.date};update(next);
    try{
      for(const view of views){const photo=next.photos[view];if(!photo||photo.saved)continue;
        await onUpload(photo.file,photo.id,view,next.uploadDate,controller.current.signal);
        if(!mounted.current)return;
        next={...next,photos:{...next.photos,[view]:{...photo,saved:true}}};update(next);onSaved(photo.id);
      }
      forgetPhotoDraft(draftKey);onClose();
    }catch(failure){if(mounted.current)setError(failure instanceof Error&&failure.name==='TimeoutError'?'The upload timed out. Your selected photos are still here. Retry Save.':failure instanceof Error?failure.message:'Upload failed. Your selected photos are still here. Retry Save.');}
    finally{running.current=false;if(mounted.current)setBusy(false);}
  }
  return <><Dialog title={kind==='progress'?'Photo Entry':kind==='cover'?'Cover Photo':'Profile Photo'} className="member-photo-entry" onClose={close}>
    <form onSubmit={e=>{e.preventDefault();void save();}} className="photo-entry-form" aria-busy={busy}>
      <div className="photo-entry-rows">{views.map(view=>{const photo=draft.photos[view];return <div className="photo-entry-row" key={view}><span className="photo-entry-thumbnail">{photo?<SelectedPhoto file={photo.file}/>:null}</span><div><span>{kind==='progress'?labels[view]:kind==='cover'?'Cover Photo':'Profile Photo'}</span>{photo?.saved?<span className="photo-saved" role="status">Saved</span>:<button type="button" className="photo-pick" aria-label={`${photo?'Change':'Add'} ${kind==='progress'?labels[view]:kind+' photo'}`} disabled={busy} onClick={()=>setSource(view)}>{photo?'Change Photo':'Add Photo'}</button>}</div></div>;})}</div>
      <p className="photo-privacy">Only you can view these photos.</p><ErrorNote message={error}/>
      {error&&<p className="photo-retry-note">Saved photos stay saved. Retry Save to finish the remaining photos.</p>}
      <button className="button primary full" disabled={busy||!dirty}>{busy?'Saving…':'Save'}</button>
    </form>
  </Dialog>{source&&<Dialog title="Choose Photo Source" className="photo-source-dialog member-photo-source" onClose={()=>setSource(null)}><button className="photo-pick" onClick={()=>{setCamera(source);setSource(null);}}>Take Photo</button><label className="photo-pick">Photo Library<input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Photo Library" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;setSource(null);if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>4194304||!file.size){setError('Choose a JPEG, PNG or WebP photo smaller than 4 MB.');return;}setError('');update({...draft,photos:{...draft.photos,[source]:{id:crypto.randomUUID(),file,saved:false}}});}}/></label><button className="button" onClick={()=>setSource(null)}>Cancel</button></Dialog>}{camera&&<CameraCapture onClose={()=>setCamera(null)} onPhoto={file=>{setError('');update({...draft,photos:{...draft.photos,[camera]:{id:crypto.randomUUID(),file,saved:false}}});setCamera(null);}}/>}{discard&&<Dialog title="Discard selected photos?" onClose={()=>setDiscard(false)}><p>Unsaved selections will be removed. Photos already saved will remain in your library.</p><button className="button primary" onClick={()=>setDiscard(false)}>Keep Editing</button><button className="button" onClick={()=>{forgetPhotoDraft(draftKey);setDiscard(false);onClose();}}>Discard Selections</button></Dialog>}</>;
}
export function MemberMediaView({items,kind,today,draftKey,back,onUpload,onSaved,onRemove,onSelect,onDone,renderPhoto=(item)=><PrivatePhoto item={item}/>}:{items:MemberMedia[];kind:Kind;today:string;draftKey:string;back:string;onUpload:Parameters<typeof PhotoEntry>[0]['onUpload'];onSaved:()=>void;onRemove:(item:MemberMedia)=>Promise<void>;onSelect:(item:MemberMedia)=>Promise<void>;onDone:()=>void;renderPhoto?:(item:MemberMedia)=>ReactNode}){
  const [adding,setAdding]=useState(()=>!!getPhotoDraft(draftKey)),[viewing,setViewing]=useState<MemberMedia|null>(null),[confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [selected,setSelected]=useState<string|null>(()=>items.find(item=>item.kind===kind&&item.selected_at)?.id||null),[leaving,setLeaving]=useState(false);
  const running=useRef(false),photos=items.filter(item=>item.kind===kind),dates=[...new Set(photos.map(photo=>photo.taken_on))];
  const committed=photos.find(photo=>photo.selected_at)?.id||null,chosen=photos.find(photo=>photo.id===selected);
  async function remove(){if(!viewing||running.current)return;running.current=true;setBusy(true);setError('');try{await onRemove(viewing);if(selected===viewing.id)setSelected(null);setConfirm(false);setViewing(null);}catch(failure){setError(failure instanceof Error?failure.message:'Could not remove this photo. Retry.');}finally{running.current=false;setBusy(false);}}
  async function commit(){if(!chosen||running.current)return;if(chosen.id===committed){onDone();return;}running.current=true;setBusy(true);setError('');try{await onSelect(chosen);onDone();}catch(failure){setError(failure instanceof Error?failure.message:'Could not save your selection. Retry.');}finally{running.current=false;setBusy(false);}}
  const dialogs=<>
    {adding&&<PhotoEntry kind={kind} today={today} draftKey={draftKey} onClose={()=>setAdding(false)} onSaved={id=>{if(kind!=='progress')setSelected(id);onSaved();}} onUpload={onUpload}/>}
    {viewing&&<Dialog title={description(viewing)} className="member-photo-viewer" onClose={()=>{if(!busy){setViewing(null);setConfirm(false);setError('');}}}><div className="photo-viewer-image">{renderPhoto(viewing)}</div><p className="photo-privacy">Only you can view this photo.</p><ErrorNote message={error}/>{confirm?<><p>Delete this photo permanently?</p><button className="button primary" disabled={busy} onClick={()=>void remove()}>{busy?'Deleting…':'Delete Photo'}</button><button className="button" disabled={busy} onClick={()=>{setConfirm(false);setError('');}}>Keep Photo</button></>:<button className="button" onClick={()=>setConfirm(true)}><Trash2 size={18}/> Delete Photo</button>}</Dialog>}
    {leaving&&<Dialog title="Leave without changing your photo?" onClose={()=>setLeaving(false)}><p>Your current profile image will stay the same. Uploaded photos remain in your library.</p><button className="button primary" onClick={()=>setLeaving(false)}>Keep Editing</button><Link className="button" href={back}>Leave Without Saving</Link></Dialog>}
  </>;
  if(kind!=='progress')return <section className="member-photo-editor">
    <header className="native-titlebar"><Link href={back} className="icon-button" aria-label="Back" onClick={event=>{if(busy||selected!==committed){event.preventDefault();if(!busy)setLeaving(true);}}}><ChevronLeft/></Link><h1>{kind==='cover'?'Edit Cover Photo':'Edit Profile Photo'}</h1><button className="icon-button photo-commit" aria-label="Save photo selection" disabled={busy||!chosen} onClick={()=>void commit()}><Check/></button></header>
    <ErrorNote message={error}/><div className="photo-selection-grid"><button className="photo-upload-tile" aria-label="Upload a photo" onClick={()=>setAdding(true)} disabled={busy}><Images size={34}/></button>{photos.map(photo=><article className={selected===photo.id?'is-selected':''} key={photo.id}><div className="photo-selection-image">{renderPhoto(photo)}</div><button className="photo-selection-button" disabled={busy} aria-pressed={selected===photo.id} aria-label={`Select ${description(photo)}`} onClick={()=>{setSelected(photo.id);setError('');}}>{selected===photo.id&&<Check size={22}/>}</button></article>)}</div>
    {chosen&&<div className="photo-selection-actions"><p className="photo-privacy">{committed===chosen.id?'Current photo':'Tap the checkmark to use this photo.'}</p><button className="button" disabled={busy} onClick={()=>{setViewing(chosen);setError('');}}>View Selected Photo</button></div>}{busy&&<p className="photo-privacy" role="status">Saving…</p>}{dialogs}
  </section>;
  return <section className="member-photos"><header><Link href={back} className="icon-button" aria-label="Back"><ChevronLeft/></Link><button className="icon-button" aria-label="Add photo entry" onClick={()=>setAdding(true)}><Plus/></button></header><h1>Progress Photos</h1>
    {dates.length?dates.map(date=><section className="member-photo-day" key={date}><h2>{new Date(date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</h2><div className="member-photo-grid">{photos.filter(photo=>photo.taken_on===date).map(photo=><article key={photo.id}><div className="member-photo-thumb">{renderPhoto(photo)}</div><button className="photo-view-button" aria-label={`${labels[photo.view]} — view ${photo.taken_on}`} onClick={()=>{setViewing(photo);setError('');}}/></article>)}</div></section>):<p className="photo-empty">Your photos will appear here. Tap + to add an entry.</p>}{dialogs}
  </section>;
}
export function MemberMediaArea({account,kind,query}:{account:Bootstrap;kind:Kind;query:string}){
  const resource=useResource<MemberMedia[]>('me/media'),router=useRouter(),selectionRetry=useRef<{id:string;commandId:string}|null>(null);
  if(!resource.data)return <Pending error={resource.error} reload={resource.reload}/>;
  return <><ErrorNote message={resource.error}/><MemberMediaView items={resource.data} kind={kind} today={localDate(account.user.timezone)} draftKey={`${account.user.id}:${kind}`} back={`${kind==='progress'?'/app/history':'/app/profile/edit'}${query}`} onSaved={resource.reload} onDone={()=>router.push(`/app/profile/edit${query}`)} onSelect={async item=>{if(selectionRetry.current?.id!==item.id)selectionRetry.current={id:item.id,commandId:crypto.randomUUID()};await api(`me/media/${item.id}/selection`,{method:'POST',body:{commandId:selectionRetry.current.commandId}});selectionRetry.current=null;resource.update(rows=>rows.map(row=>row.kind===kind?{...row,selected_at:row.id===item.id?new Date().toISOString():null}:row));resource.reload();}} onUpload={async(file,id,view,date,signal)=>{await api('me/media?'+new URLSearchParams({kind,view,date}),{method:'POST',file,uploadId:id,signal});}} onRemove={async item=>{await api(`me/media/${item.id}`,{method:'DELETE'});resource.update(rows=>rows.filter(r=>r.id!==item.id));resource.reload();}}/></>;
}
export function ProfileWithPhotos({account,data,query}:{account:Bootstrap;data?:RelationshipDetail;query:string}){
  const media=useResource<MemberMedia[]>('me/media');
  const latest=(kind:Kind)=>media.data?.find(item=>item.kind===kind&&item.selected_at);
  const avatar=latest('avatar'),cover=latest('cover');
  return <><ErrorNote message={media.error}/>{media.error&&<button className="button" onClick={media.reload}>Retry profile photos</button>}<ProfileOverview account={account} data={data} query={query} avatar={avatar?<PrivatePhoto item={avatar}/>:undefined} cover={cover?<PrivatePhoto item={cover}/>:undefined}/></>;
}
