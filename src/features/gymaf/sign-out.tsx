"use client";
import { useRef, useState } from 'react';
import { api } from './api';
import { Dialog, ErrorNote } from './ui';

async function signOut() { await api('auth/logout',{method:'POST',body:{}});window.location.replace('/login'); }
export function SignOutButton({onSignOut=signOut}:{onSignOut?:()=>Promise<void>}) {
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const running=useRef(false);
  async function confirm() { if(running.current)return;running.current=true;setBusy(true);setError('');try{await onSignOut();}catch(failure){setError(failure instanceof Error?failure.message:'Sign-out could not be confirmed. Retry Sign Out.');}finally{running.current=false;setBusy(false);} }
  return <><button type="button" className="profile-sign-out" onClick={()=>{setError('');setOpen(true);}}>Sign Out</button>{open&&<Dialog title="Sign Out" className="profile-signout-dialog" onClose={()=>{if(!running.current)setOpen(false);}}><p>Are you sure you want to sign out?</p><ErrorNote message={error}/><div className="profile-signout-actions"><button type="button" autoFocus disabled={busy} onClick={()=>setOpen(false)}>Cancel</button><button type="button" disabled={busy} onClick={()=>void confirm()}>{busy?'Signing Out…':'Sign Out'}</button></div></Dialog>}</>;
}
