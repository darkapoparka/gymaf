"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Check, X } from 'lucide-react';
import type { Bootstrap, MemberMedia, Profile } from '@/shared/gymaf/contracts';
import { normalizeInterest } from '@/shared/gymaf/account-details';
import { validateCommand } from '@/shared/gymaf/validation';
import { EditorError, editorError } from "./editor-error";
import { api } from './api';
import { Dialog, ErrorNote, Field, useResource } from './ui';
import { PrivatePhoto } from './member-media';
import { SignOutButton } from './sign-out';
import { forgetProfileDraft, freshProfileDraft, getProfileDraft, profileChanged, putProfileDraft, type ProfileDraft, type ProfileFields } from './profile-drafts';

export function ProfileEditor({user,query,reload}:{user:Profile;query:string;reload:()=>void}) {
  const router=useRouter(),media=useResource<MemberMedia[]>('me/media');
  const cover=media.data?.find(item=>item.kind==='cover'&&item.selected_at);
  return <ProfileEditorView user={user} query={query} footer={<SignOutButton/>} cover={cover?<PrivatePhoto item={cover}/>:undefined} mediaError={media.error} retryMedia={media.reload}
    onLeave={()=>router.push(`/app/profile${query}`)}
    onSave={async(draft,signal)=>{const command=validateCommand({action:'profile.save',commandId:draft.commandId,payload:{...draft.fields,revision:draft.revision}});await api('commands',{method:'POST',body:command,signal});reload();}}
    onReload={async signal=>{const saved=await api<Bootstrap>('me',{signal});reload();return saved.user;}}/>;
}

export function ProfileEditorView({user,query='',cover,footer,mediaError,retryMedia,onLeave,onSave,onReload}:{user:Profile;query?:string;cover?:ReactNode;footer?:ReactNode;mediaError?:string;retryMedia?:()=>void;onLeave:()=>void;onSave:(draft:ProfileDraft,signal:AbortSignal)=>Promise<void>;onReload:(signal:AbortSignal)=>Promise<Profile>}) {
  const [draft,setDraft]=useState(()=>getProfileDraft(user.id)||freshProfileDraft(user));
  const interest=draft.interestInput||'', [interestError,setInterestError]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[dialog,setDialog]=useState<'leave'|'reload'|null>(null);
  const running=useRef(false),mounted=useRef(true),controller=useRef<AbortController|null>(null),form=useRef<HTMLFormElement>(null);
  const formId=useId(),dirty=profileChanged(draft);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
  useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  function update(next:ProfileDraft) { putProfileDraft(user.id,next);setDraft(next); }
  function change<K extends keyof ProfileFields>(key:K,value:ProfileFields[K]) { update({...draft,fields:{...draft.fields,[key]:value},commandId:undefined}); }
  function addInterest() {
    const value=normalizeInterest(interest);
    if(!value)return;
    if(value.length>40 || !/^[-\p{L}\p{N}_ ]+$/u.test(value)){setInterestError('Use up to 40 letters, numbers, spaces, dashes or underscores.');return;}
    if(draft.fields.interests.length>=20){setInterestError('You can add up to 20 interests.');return;}
    if(draft.fields.interests.some(item=>item.toLowerCase()===value.toLowerCase())){setInterestError('This interest is already in your list.');return;}
    update({...draft,fields:{...draft.fields,interests:[...draft.fields.interests,value]},interestInput:'',commandId:undefined});setInterestError('');
  }
  function leave() { if(running.current)return;if(dirty)setDialog('leave');else{forgetProfileDraft(user.id);onLeave();} }
  async function save() {
    if(running.current||!dirty)return;
    if(interest.trim()){setError('Add or clear the interest you are typing before saving.');return;}
    if(!form.current?.checkValidity()){setDialog(null);setError('Complete the required profile fields before saving.');requestAnimationFrame(()=>form.current?.reportValidity());return;}
    running.current=true;setBusy(true);setError('');controller.current=new AbortController();
    const next={...draft,commandId:draft.commandId||crypto.randomUUID()};update(next);
    try { await onSave(next,controller.current.signal);if(!mounted.current)return;forgetProfileDraft(user.id);onLeave(); }
    catch(failure) { if(mounted.current)setError(editorError(failure,'save your profile')); }
    finally { running.current=false;if(mounted.current)setBusy(false); }
  }
  async function reloadSaved() {
    if(running.current)return;running.current=true;setBusy(true);setError('');controller.current=new AbortController();
    try { const saved=await onReload(controller.current.signal);if(!mounted.current)return;if(saved.id!==user.id)throw new Error('Your account changed. Sign in again.');forgetProfileDraft(user.id);setDraft(freshProfileDraft(saved));setDialog(null); }
    catch(failure) { if(mounted.current)setError(editorError(failure,'load your saved profile')); }
    finally { running.current=false;if(mounted.current)setBusy(false); }
  }
  return <section className="connected-profile-editor" aria-busy={busy}>
    <header className="native-titlebar"><button type="button" className="icon-button" aria-label="Close Edit Profile" disabled={busy} onClick={leave}><X/></button><h1>Edit Profile</h1><button type="submit" form={formId} className="icon-button profile-commit" aria-label={busy?'Saving profile':'Save profile'} disabled={busy||!dirty}><Check/></button></header>
    <form id={formId} ref={form} onSubmit={event=>{event.preventDefault();void save();}}>
      <fieldset disabled={busy}>
        <div className="profile-editor-field"><span>Cover Photo</span><div className="profile-cover-control"><span className="profile-cover-preview">{cover||<Camera aria-hidden="true"/>}</span><Link href={`/app/profile/cover${query}`} onClick={event=>{if(running.current)event.preventDefault();}}>Update cover photo</Link></div></div>
        {mediaError&&<div className="profile-media-error"><ErrorNote message="Your cover could not be loaded."/><button type="button" onClick={retryMedia}>Retry cover</button></div>}
        <Field label="Display Name" autoComplete="nickname" required maxLength={120} value={draft.fields.displayName} onChange={event=>change('displayName',event.target.value)}/>
        <div className="profile-editor-field"><label htmlFor={`${formId}-interest`}>Interests &amp; Hashtags</label><div className="profile-interest-box"><div className="profile-interest-entry"><input id={`${formId}-interest`} value={interest} placeholder="Add Interest" maxLength={41} onChange={event=>{update({...draft,interestInput:event.target.value});setInterestError('');}} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();addInterest();}}}/>{interest.trim()&&<button type="button" onClick={addInterest}>Add</button>}</div>{draft.fields.interests.length>0&&<ul className="profile-interest-tags">{draft.fields.interests.map(item=><li key={item}><span>#{item}</span><button type="button" aria-label={`Remove ${item}`} onClick={()=>change('interests',draft.fields.interests.filter(value=>value!==item))}><X size={15}/></button></li>)}</ul>}</div><ErrorNote message={interestError}/></div>
        <div className="profile-privacy"><button type="button" className="member-toggle-row" role="switch" aria-checked="true" disabled><span>Private Profile</span><i/></button><p>Your profile details and interests are private. Public profiles and sharing are not available yet.</p></div>
        <details className="profile-extra-fields"><summary>Training &amp; Account Preferences</summary><div>
        <section className="profile-training-fields"><h2>Training Details</h2><p className="profile-field-help">These details help your coach plan your training.</p>
          {([['goal','Training Goal',500],['equipment','Available Equipment',1000],['availability','Training Availability',1000]] as const).map(([key,label,max])=><label className="form-field" key={key}><span>{label}</span><textarea value={draft.fields[key]} maxLength={max} onChange={event=>change(key,event.target.value)}/></label>)}
        </section>
        <section className="profile-account-fields"><h2>Account Preferences</h2><label className="form-field"><span>Language</span><select value={draft.fields.locale} onChange={event=>change('locale',event.target.value as Profile['locale'])}><option value="bg">Български</option><option value="en">English</option></select></label><Field label="Timezone" required maxLength={80} value={draft.fields.timezone} onChange={event=>change('timezone',event.target.value)}/></section></div></details>
        <Link className="profile-avatar-link" href={`/app/profile/avatar${query}`} onClick={event=>{if(running.current)event.preventDefault();}}><Camera aria-hidden="true"/>Update profile photo</Link>
      </fieldset>
      <EditorError message={error}/>{error&&<p className="profile-field-help">Your edits are still here. Retry Save, or reload the saved profile to resolve a conflict.</p>}
      <div className="profile-editor-actions"><button className="button primary full" disabled={busy||!dirty}>{busy?'Saving…':'Save Profile'}</button>{error&&<button type="button" className="button full" disabled={busy} onClick={()=>setDialog('reload')}>Reload Saved Profile</button>}</div>
    </form>
    <div className="profile-editor-links"><Link href={`/app/account${query}`}>Your Account</Link><Link href={`/app/settings/security${query}`}>Account Security</Link><Link href={`/app/settings/support${query}`}>Help &amp; Your Data</Link>{footer}</div>
    {dialog&&<Dialog title={dialog==='leave'?'Save profile changes?':'Reload saved profile?'} className="profile-exit-dialog" onClose={()=>{if(!running.current)setDialog(null);}}>
      <p>{dialog==='leave'?'You have unsaved changes to your profile.':'Reloading replaces your edits with the last saved profile. You can keep editing instead.'}</p><EditorError message={error}/>
      {dialog==='leave'?<><button className="button primary full" disabled={busy} onClick={()=>void save()}>{busy?'Saving…':'Save and Leave'}</button><button className="button full" disabled={busy} onClick={()=>setDialog(null)}>Keep Editing</button><button className="button full" disabled={busy} onClick={()=>{forgetProfileDraft(user.id);onLeave();}}>Discard and Leave</button></>:<><button className="button full" disabled={busy} onClick={()=>setDialog(null)}>Keep Editing</button><button className="button full" disabled={busy} onClick={()=>void reloadSaved()}>{busy?'Loading…':'Discard Changes and Reload'}</button></>}
    </Dialog>}
  </section>;
}
