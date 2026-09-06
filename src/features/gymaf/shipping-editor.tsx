"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import type { MemberRecord } from '@/shared/gymaf/contracts';
import { emptyShipping,isUSAddress,type ShippingFields } from '@/shared/gymaf/shipping-address';
import { InputError,validateCommand,shirtSizes,usStates } from '@/shared/gymaf/validation';
import { api } from './api';
import { Dialog,Field,Pending,useResource } from './ui';
import { EditorError,editorError } from './editor-error';
import { forgetShippingDraft,getShippingDraft,putShippingDraft,shippingChanged,type ShippingDraft } from './shipping-drafts';

function fresh(records:MemberRecord[]):ShippingDraft {
  const saved=records.find(record=>String(record.kind)==='shipping'),fields=emptyShipping();
  if(saved)for(const key of Object.keys(fields) as (keyof ShippingFields)[])fields[key]=String(saved.data[key]??fields[key]);
  return {id:saved?.id||crypto.randomUUID(),fields,baseline:fields,revision:saved?.revision||0};
}
export function ShippingEditor({ownerId,query}:{ownerId:string;query:string}) {
  const resource=useResource<MemberRecord[]>('me/details');
  if(!resource.data)return <Pending error={resource.error} reload={resource.reload}/>;
  return <Editor key={ownerId} ownerId={ownerId} query={query} records={resource.data}/>;
}
function Editor({ownerId,query,records}:{ownerId:string;query:string;records:MemberRecord[]}) {
  const router=useRouter(),form=useRef<HTMLFormElement>(null),[draft,setDraft]=useState(()=>getShippingDraft(ownerId)||fresh(records));
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[dialog,setDialog]=useState<'leave'|'reload'|'remove'|null>(null);
  const running=useRef(false),mounted=useRef(true),controller=useRef<AbortController|null>(null),dirty=shippingChanged(draft),isUS=isUSAddress(draft.fields.country);
  const complete=!!(draft.fields.street.trim()&&draft.fields.city.trim()&&draft.fields.country.trim().length>=2&&draft.fields.shirtSize&&(!isUS||(usStates.some(value=>value===draft.fields.region)&&/^\d{5}(-\d{4})?$/.test(draft.fields.postalCode))));
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
  useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  function update(next:ShippingDraft){putShippingDraft(ownerId,next);setDraft(next);}
  function change(key:keyof ShippingFields,value:string){update({...draft,fields:{...draft.fields,[key]:value},commandId:undefined});}
  function exit(){router.push(`/app/account${query}`);}
  async function save(){
    if(running.current||!dirty)return;
    if(!form.current?.checkValidity()){setDialog(null);requestAnimationFrame(()=>form.current?.reportValidity());return;}
    running.current=true;setBusy(true);setError('');controller.current=new AbortController();
    const next={...draft,commandId:draft.commandId||crypto.randomUUID()};update(next);
    try{const command=validateCommand({action:'member.save',commandId:next.commandId,payload:{id:next.id,kind:'shipping',data:next.fields,revision:next.revision}});await api('commands',{method:'POST',body:command,signal:controller.current.signal});if(mounted.current){forgetShippingDraft(ownerId);exit();}}
    catch(failure){if(mounted.current)setError(failure instanceof InputError?failure.message:editorError(failure,'save your address'));}
    finally{running.current=false;if(mounted.current)setBusy(false);}
  }
  async function reload(){
    if(running.current)return;running.current=true;setBusy(true);setError('');controller.current=new AbortController();
    try{const saved=await api<MemberRecord[]>('me/details',{signal:controller.current.signal});if(mounted.current){forgetShippingDraft(ownerId);setDraft(fresh(saved));setDialog(null);}}
    catch(failure){if(mounted.current)setError(editorError(failure,'load your saved address'));}
    finally{running.current=false;if(mounted.current)setBusy(false);}
  }
  async function remove(){
    if(running.current||!draft.revision)return;running.current=true;setBusy(true);setError('');controller.current=new AbortController();
    const next={...draft,deleteCommandId:draft.deleteCommandId||crypto.randomUUID()};update(next);
    try{const command=validateCommand({action:'member.delete',commandId:next.deleteCommandId,payload:{id:next.id,kind:'shipping',revision:next.revision}});await api('commands',{method:'POST',body:command,signal:controller.current.signal});if(mounted.current){forgetShippingDraft(ownerId);exit();}}
    catch(failure){if(mounted.current)setError(editorError(failure,'remove your saved address'));}
    finally{running.current=false;if(mounted.current)setBusy(false);}
  }
  return <section className="shipping-editor" aria-busy={busy}><header className="native-titlebar"><button className="icon-button" aria-label="Close Shipping Address" disabled={busy} onClick={()=>{if(dirty)setDialog('leave');else{forgetShippingDraft(ownerId);exit();}}}><X/></button><h1>Shipping Address</h1><span/></header>
    <form ref={form} onSubmit={event=>{event.preventDefault();void save();}}><fieldset disabled={busy}>
      <div className="shipping-field-card"><Field label="Street Address" autoComplete="address-line1" required maxLength={200} value={draft.fields.street} onChange={event=>change('street',event.target.value)}/><Field label="Apt, suite, etc. (optional)" placeholder="Apt, suite, etc. (optional)" autoComplete="address-line2" maxLength={120} value={draft.fields.apartment} onChange={event=>change('apartment',event.target.value)}/><Field label="City" autoComplete="address-level2" required maxLength={120} value={draft.fields.city} onChange={event=>change('city',event.target.value)}/>
        <div className="shipping-region">{isUS?<label className="form-field">State<select autoComplete="address-level1" required value={draft.fields.region} onChange={event=>change('region',event.target.value)}><option value="">Select</option>{usStates.map(value=><option key={value}>{value}</option>)}</select></label>:<Field label="Region (optional)" autoComplete="address-level1" maxLength={120} value={draft.fields.region} onChange={event=>change('region',event.target.value)}/>}<Field label={isUS?'Zip code':'Postal code (optional)'} autoComplete="postal-code" required={isUS} inputMode={isUS?'numeric':'text'} pattern={isUS?'[0-9]{5}(-[0-9]{4})?':undefined} maxLength={20} value={draft.fields.postalCode} onChange={event=>change('postalCode',event.target.value)}/></div>
      </div>
      <label className="form-field shipping-size">Shirt Size<select required value={draft.fields.shirtSize} onChange={event=>change('shirtSize',event.target.value)}><option value="">Select</option>{shirtSizes.map(value=><option key={value}>{value}</option>)}</select></label>
      <button className="shipping-update" disabled={busy||!dirty||!complete}>{busy?'Saving…':'Update'}</button>
      <p className="shipping-help">Your address and shirt size are private preferences. Saving does not place an order, send them to your coach, or start a shipment.</p>
      <div className="shipping-country"><Field label="Country" autoComplete="country-name" required minLength={2} maxLength={80} value={draft.fields.country} onChange={event=>change('country',event.target.value)}/></div>
      <EditorError message={error}/>{error&&<button type="button" className="button full" onClick={()=>setDialog('reload')}>Reload Saved Address</button>}{draft.revision>0&&<button type="button" className="button full" onClick={()=>setDialog('remove')}>Remove Saved Address</button>}
    </fieldset></form>
    {dialog&&<Dialog title={dialog==='leave'?'Save address changes?':dialog==='reload'?'Reload saved address?':'Remove saved address?'} onClose={()=>{if(!busy)setDialog(null);}}><p>{dialog==='leave'?'You have unsaved address changes.':dialog==='reload'?'Reloading replaces your edits with the saved address.':'This removes your saved address and shirt-size preference. It does not cancel an order or shipment.'}</p><EditorError message={error}/>{dialog==='leave'&&<button className="button primary full" disabled={busy} onClick={()=>void save()}>Save and Leave</button>}<button className="button full" disabled={busy} onClick={()=>setDialog(null)}>{dialog==='remove'?'Keep Address':'Keep Editing'}</button><button className="button full" disabled={busy} onClick={()=>{if(dialog==='remove')void remove();else if(dialog==='reload')void reload();else{forgetShippingDraft(ownerId);exit();}}}>{dialog==='remove'?'Remove Address':dialog==='reload'?'Discard Changes and Reload':'Discard and Leave'}</button></Dialog>}
  </section>;
}
