"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ArrowBigUp, CornerDownLeft, Delete, Mic, Smile } from "lucide-react";
import { useCapture } from "@/lib/capture-context";

export type KeyboardSeed = { type: "text" | "email" | "number" | "phone"; selector: string; dark?: boolean; done?: boolean; symbols?: boolean };
function subscribeDialog(callback:()=>void) {const observer=new MutationObserver(callback);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});return()=>observer.disconnect();}
const dialogHost=()=>Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')).at(-1)||null;

/** Interactive keyboard for source-capture previews. Ordinary app inputs use the device keyboard. */
export function CaptureKeyboard() {
  const capture=useCapture();
  const seed=capture?.ui.keyboard as KeyboardSeed|undefined;
  const [visible,setVisible]=useState(!!seed);
  const [shift,setShift]=useState(seed?.type!=='email');
  const [symbols,setSymbols]=useState(!!seed?.symbols);
  const [hint,setHint]=useState('');
  const input=useRef<HTMLInputElement|HTMLTextAreaElement|null>(null);
  const host=useSyncExternalStore(subscribeDialog,dialogHost,()=>null);
  useEffect(()=>{
    if(!seed||!visible)return;
    const field=document.querySelector<HTMLInputElement|HTMLTextAreaElement>(seed.selector);
    if(host && (!field || !host.contains(field)))return;
    input.current=field;
    const priorMode=field?.inputMode;
    if(field){field.inputMode='none';field.focus({preventScroll:true});}
    document.documentElement.dataset.captureKeyboard=seed.type;
    return()=>{delete document.documentElement.dataset.captureKeyboard;if(field)field.inputMode=priorMode||'';};
  },[seed,visible,host]);
  if(!capture||!seed||!visible||(host && !host.querySelector(seed.selector)))return null;
  const numeric=seed.type==='number'||seed.type==='phone';
  function key(value:string) {
    const field=input.current;
    if(!field)return;
    if(seed?.type!=='number'&&seed?.type!=='phone'&&/^[a-z]$/i.test(value))setShift(false);
    const from=field.selectionStart??field.value.length,to=field.selectionEnd??from;
    const start=value==='Backspace'&&from===to?Math.max(0,from-1):from;
    const next=field.value.slice(0,start)+(value==='Backspace'?'':value)+field.value.slice(to);
    const prototype=field instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype,'value')?.set?.call(field,next);
    field.dispatchEvent(new Event('input',{bubbles:true}));
    field.focus({preventScroll:true});
    try {field.setSelectionRange(start+(value==='Backspace'?0:value.length),start+(value==='Backspace'?0:value.length));} catch{}
  }
  const letters=symbols?['1234567890','-/:;()$&@"', '.,?!\'']:['qwertyuiop','asdfghjkl','zxcvbnm'];
  const keyboard=<section className={`capture-keyboard ${numeric?'numeric':''} ${seed.dark?'dark':''}`} aria-label="Reference keyboard" onPointerDown={e=>e.preventDefault()}>
    {seed.done&&<button className="keyboard-done" onClick={()=>{setVisible(false);input.current?.blur();}}>Done</button>}
    {numeric?<div className="number-keys">{['1','2','3','4','5','6','7','8','9',seed.type==='phone'?'+*#':'.','0','Backspace'].map((n,i)=><button key={n} className={i===9||i===11?'plain':''} aria-label={n==='Backspace'?'Delete character':n} onClick={()=>key(n)}>{n==='Backspace'?<Delete/>:<>{n}<small>{['','ABC','DEF','GHI','JKL','MNO','PQRS','TUV','WXYZ'][i]}</small></>}</button>)}</div>:<>
      {letters.map((row,i)=><div className={`key-row row-${i}`} key={i}>{i===2&&<button className="shift-key" aria-label="Shift" aria-pressed={shift} onClick={()=>setShift(!shift)}><ArrowBigUp fill={shift?'currentColor':'none'}/></button>}{[...row].map(c=><button key={c} onClick={()=>key(shift?c.toUpperCase():c)}>{shift?c.toUpperCase():c}</button>)}{i===2&&<button className="delete-key" aria-label="Delete character" onClick={()=>key('Backspace')}><Delete/></button>}</div>)}
      <div className={`key-row keyboard-bottom ${seed.type==='email'?'email':''}`}><button onClick={()=>setSymbols(!symbols)}>{symbols?'ABC':'123'}</button><button className="space-key" aria-label="Space" onClick={()=>key(' ')}/>{seed.type==='email'&&<><button onClick={()=>key('@')}>@</button><button onClick={()=>key('.')}>.</button></>}<button aria-label="Return" onClick={()=>{if(input.current instanceof HTMLTextAreaElement)key('\n');else{setVisible(false);input.current?.blur();}}}><CornerDownLeft/></button></div>
      <div className="keyboard-accessory"><button aria-label="Insert smile" onClick={()=>key('🙂')}><Smile/></button><button aria-label="Dictation information" onClick={()=>setHint('Use your device keyboard for voice input.')}><Mic/></button></div>
    </>}
    {hint&&<p role="status" className="keyboard-hint">{hint}</p>}
  </section>;
  return createPortal(keyboard,host||document.body);
}
