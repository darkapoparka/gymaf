"use client";
import { useEffect, useRef } from 'react';
import { ApiError } from './api';

export function editorError(failure:unknown,operation:string) {
  return failure instanceof ApiError ? failure.message : `Couldn’t ${operation}. Check your connection and retry. Your edits are kept.`;
}
export function EditorError({message}:{message:string}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!message||!ref.current)return;
    const dialog=document.querySelector('dialog[open]');
    if(dialog&&!dialog.contains(ref.current))return;
    ref.current.focus({preventScroll:true});ref.current.scrollIntoView({block:'center'});
  },[message]);
  return message?<div ref={ref} tabIndex={-1} className="gymaf-error editor-error" role="alert">{message}</div>:null;
}
