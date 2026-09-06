"use client";
import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, X } from 'lucide-react';
import type { MemberRecord, Profile } from '@/shared/gymaf/contracts';
import type { AccountFields } from '@/shared/gymaf/account-details';
import { validateCommand } from '@/shared/gymaf/validation';
import { EditorError, editorError } from "./editor-error";
import { api } from './api';
import { Dialog, Field, Pending, useResource } from './ui';
import { SignOutButton } from './sign-out';
import { accountChanged, forgetAccountDraft, freshAccountDraft, getAccountDraft, putAccountDraft, type AccountDraft } from './account-drafts';

type AccountResource={email:string;records:MemberRecord[]};
export function AccountEditor({user,query}:{user:Profile;query:string}) {
  const resource=useResource<AccountResource>('me/account');
  if(!resource.data)return <Pending error={resource.error} reload={resource.reload}/>;
  return <AccountEditorView user={user} query={query} data={resource.data}/>;
}
function AccountEditorView({user,query,data}:{user:Profile;query:string;data:AccountResource}) {
  const router=useRouter(),formId=useId(),form=useRef<HTMLFormElement>(null);
  const [draft,setDraft]=useState(()=>getAccountDraft(user.id)||freshAccountDraft(data.records.find(item=>item.kind==='account')));
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[dialog,setDialog]=useState<'leave'|'reload'|null>(null);
  const mounted=useRef(true),running=useRef(false),controller=useRef<AbortController|null>(null),dirty=accountChanged(draft);
  const weight=data.records.filter(item=>item.kind==='weight').sort((a,b)=>String(b.data.date).localeCompare(String(a.data.date))||b.updated_at.localeCompare(a.updated_at))[0];
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
  useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  function update(next:AccountDraft){putAccountDraft(user.id,next);setDraft(next);}
  function change(key:keyof AccountFields,value:string){update({...draft,fields:{...draft.fields,[key]:value},commandId:undefined});}
  function exit(){router.push(`/app/settings${query}`);}
  async function save(){
    if(running.current||!dirty)return;
    if(!form.current?.checkValidity()){setDialog(null);requestAnimationFrame(()=>form.current?.reportValidity());return;}
    running.current=true;setBusy(true);setError('');controller.current=new AbortController();
    const next={...draft,commandId:draft.commandId||crypto.randomUUID()};update(next);
    try{const command=validateCommand({action:'member.save',commandId:next.commandId,payload:{id:next.id,kind:'account',revision:next.revision,data:next.fields}});await api('commands',{method:'POST',body:command,signal:controller.current.signal});if(mounted.current){forgetAccountDraft(user.id);exit();}}
    catch(failure){if(mounted.current)setError(editorError(failure,'save your account'));}
    finally{running.current=false;if(mounted.current)setBusy(false);}
  }
  async function reload(){
    if(running.current)return;running.current=true;setBusy(true);setError('');controller.current=new AbortController();
    try{const saved=await api<AccountResource>('me/account',{signal:controller.current.signal});if(mounted.current){forgetAccountDraft(user.id);setDraft(freshAccountDraft(saved.records.find(item=>item.kind==='account')));setDialog(null);}}
    catch(failure){if(mounted.current)setError(editorError(failure,'load your saved account'));}
    finally{running.current=false;if(mounted.current)setBusy(false);}
  }
  return <section className="connected-profile-editor connected-account-editor" aria-busy={busy}>
    <header className="native-titlebar"><button className="icon-button" aria-label="Close Your Account" disabled={busy} onClick={()=>{if(dirty)setDialog('leave');else{forgetAccountDraft(user.id);exit();}}}><X/></button><h1>Your Account</h1><button type="submit" form={formId} className="icon-button profile-commit" aria-label="Save account" disabled={busy||!dirty}><Check/></button></header>
    <form id={formId} ref={form} onSubmit={event=>{event.preventDefault();void save();}}><fieldset disabled={busy}>
      <h2>About You</h2><div className="account-field-card"><div className="account-preferred"><Link className="account-avatar" href={`/app/profile/avatar${query}`} aria-label="Update profile photo">{(draft.fields.preferredName||user.display_name).slice(0,1).toUpperCase()||'G'}</Link><Field label="Preferred Name" autoComplete="nickname" maxLength={120} value={draft.fields.preferredName} onChange={event=>change('preferredName',event.target.value)}/></div>
        <div className="account-field-grid"><Field label="First Name" autoComplete="given-name" maxLength={120} value={draft.fields.firstName} onChange={event=>change('firstName',event.target.value)}/><Field label="Last Name" autoComplete="family-name" maxLength={120} value={draft.fields.lastName} onChange={event=>change('lastName',event.target.value)}/>
          <label className="form-field"><span>Biological Sex</span><select value={draft.fields.biologicalSex} onChange={event=>change('biologicalSex',event.target.value)}><option value="">Not specified</option>{['Female','Male','Intersex','Prefer not to say'].map(value=><option key={value}>{value}</option>)}</select></label><Field label="Date of Birth" type="date" autoComplete="bday" min="1900-01-01" max={new Date().toISOString().slice(0,10)} value={draft.fields.dateOfBirth} onChange={event=>change('dateOfBirth',event.target.value)}/>
          <Field label="Height (cm)" type="number" inputMode="decimal" min={50} max={300} step="0.1" value={draft.fields.heightCm} onChange={event=>change('heightCm',event.target.value)}/><div className="form-field"><span>Weight (kg)</span><Link className="account-weight" href={`/app/progress/weight${query}`}>{weight?String(weight.data.valueKg):'Add weight'}</Link></div>
        </div></div>
      <h2>Login</h2><div className="account-field-card account-login"><Field label="Email" type="email" value={data.email} readOnly/><Field label="Contact Phone Number" type="tel" autoComplete="tel" maxLength={32} pattern="\+?[0-9 ()\-]{5,32}" value={draft.fields.phone} onChange={event=>change('phone',event.target.value)}/><p className="profile-field-help">Sign in with your verified email. This optional phone number is private contact information, not a sign-in method.</p></div>
      <p className="profile-field-help">These personal details are private. They do not change your display name or automatically update your coach’s training plan.</p>
      <EditorError message={error}/>{error&&<p className="profile-field-help">Your edits are still here. Retry Save or reload the saved account to resolve a conflict.</p>}
      {dirty&&<button className="button primary full" disabled={busy}>{busy?'Saving…':'Save Account'}</button>}{error&&<button type="button" className="button full" onClick={()=>setDialog('reload')}>Reload Saved Account</button>}
    </fieldset></form><div className="account-footer"><SignOutButton/><Link href={`/app/settings/service${query}`}>Membership &amp; Billing <ArrowRight/></Link><Link href={`/app/settings/support${query}`}>Account Help <ArrowRight/></Link></div>
    {dialog&&<Dialog title={dialog==='leave'?'Save account changes?':'Reload saved account?'} onClose={()=>{if(!running.current)setDialog(null);}}><p>{dialog==='leave'?'You have unsaved changes to your account.':'Reloading replaces your edits with the last saved account.'}</p><EditorError message={error}/>{dialog==='leave'&&<button className="button primary full" disabled={busy} onClick={()=>void save()}>{busy?'Saving…':'Save and Leave'}</button>}<button className="button full" disabled={busy} onClick={()=>setDialog(null)}>Keep Editing</button><button className="button full" disabled={busy} onClick={()=>{if(dialog==='reload')void reload();else{forgetAccountDraft(user.id);exit();}}}>{dialog==='reload'?'Discard Changes and Reload':'Discard and Leave'}</button></Dialog>}
  </section>;
}
