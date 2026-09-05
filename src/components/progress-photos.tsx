"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Plus, SwitchCamera, Timer, Zap, ZapOff } from "lucide-react";
import { useCapture, useCaptureState } from "@/lib/capture-context";
import { blackReferenceFrame } from "@/lib/reference-media";
import { photoData } from "@/lib/media-store";
import { useLocalData } from "@/lib/store";
import Link, { useAppRouter } from "./capture-link";
import { Back, Sheet } from "./primitives";
import { CaptureStatus } from "./capture-status";

const kinds = ["Full Body - Front","Full Body - Back","Full Body - Side"];
export function ProgressPhotos({ adding = false }: { adding?: boolean }) {
  const {data,update} = useLocalData();
  const router=useAppRouter();
  const [draft,setDraft]=useCaptureState<Record<string,string>>("photos.draft",{});
  const [kind,setKind]=useState(kinds[0]);
  const [source,setSource]=useCaptureState("photos.source",false);
  const [camera,setCamera]=useCaptureState("photos.camera",false);
  const [selected,setSelected]=useState("");
  const [error,setError]=useState("");
  const input=useRef<HTMLInputElement>(null);
  const capture=useCapture();
  function receive(src:string) {setDraft(s=>({...s,[kind]:src}));setCamera(false);setSource(false);}
  async function selectFile(file?:File) {
    if (!file) return;
    try {receive(await photoData(file));} catch(e) {setError(e instanceof Error ? e.message : "Could not open photo.");}
  }
  function save() {
    update(s=>({photos:[...s.photos,...Object.entries(draft).map(([kind,src])=>({id:crypto.randomUUID(),kind,src,date:capture ? "2026-07-01" : new Date().toISOString().slice(0,10)}))]}));
    router.push("/progress/photos");
  }
  const photos=data.photos.filter(p=>p.kind!=='message');
  const dates=[...new Set(photos.map(p=>p.date))];
  return <section className="progress-photos-page">
    <header><Back href="/progress"/><Link href="/progress/photos/add" className="icon-button" aria-label="Add progress photos"><Plus size={27}/></Link></header>
    <h1>Progress Photos</h1>
    {dates.map(date=><section className="progress-photo-day" key={date}><h2>{new Date(date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</h2><div>{photos.filter(p=>p.date===date).map(p=><button key={p.id} onClick={()=>setSelected(p.id)} aria-label={p.kind}><Image src={p.src} width={300} height={300} alt={p.kind} unoptimized/></button>)}</div></section>)}
    <input ref={input} type="file" accept="image/*" className="visually-hidden" onChange={e=>void selectFile(e.target.files?.[0])}/>
    {adding && <Sheet title="GOAL ENTRY" className="goal-entry-dialog" onClose={()=>router.push('/progress/photos')}>
      <CaptureStatus light/>
      <div className="goal-photo-rows">{kinds.map(k=><div className="goal-photo-row" key={k}><div className="goal-photo-thumb">{draft[k]&&<Image src={draft[k]} alt={k} width={80} height={80} unoptimized/>}</div><div><p>{k}</p><button onClick={()=>{setKind(k);setSource(true);}}>{draft[k] ? 'Change Photo':'Add Photo'}</button></div></div>)}</div>
      <button className="goal-photo-save" onClick={save} disabled={!Object.keys(draft).length}>SAVE</button>
      {error&&<p role="alert">{error}</p>}
      {source&&<Sheet title="Choose photo source" className="photo-source-dialog" onClose={()=>setSource(false)}><button onClick={()=>{setSource(false);setCamera(true);}}>Take Photo</button><button onClick={()=>input.current?.click()}>Photo Library</button><button onClick={()=>setSource(false)}>Cancel</button></Sheet>}
      {camera&&<PhotoCamera onCancel={()=>setCamera(false)} onPhoto={receive}/>}
    </Sheet>}
    {selected&&<Sheet title="Progress Photo" onClose={()=>setSelected('')}><Image src={photos.find(p=>p.id===selected)!.src} alt={photos.find(p=>p.id===selected)!.kind} width={500} height={500} unoptimized/><button className="button full" onClick={()=>{update(s=>({photos:s.photos.filter(p=>p.id!==selected)}));setSelected('');}}>Delete Photo</button></Sheet>}
  </section>;
}

function PhotoCamera({onCancel,onPhoto}:{onCancel:()=>void;onPhoto:(src:string)=>void}) {
  const capture=useCapture();
  const [timer,setTimer]=useCaptureState('photos.timer',5);
  const [count,setCount]=useCaptureState('photos.countdown',0);
  const flash=false;
  const [facing,setFacing]=useState<'user'|'environment'>('environment');
  const [ready,setReady]=useState(false);
  const [error,setError]=useState('');
  const video=useRef<HTMLVideoElement>(null);
  const stream=useRef<MediaStream|null>(null);
  const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{stream.current?.getTracks().forEach(t=>t.stop());if(timeout.current)clearTimeout(timeout.current);},[]);
  async function enableCamera(nextFacing=facing) {
    try {
      stream.current?.getTracks().forEach(t=>t.stop());
      const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:nextFacing}});
      stream.current=media;
      if(video.current){video.current.srcObject=media;await video.current.play();}
      setReady(true);
    } catch(e){setError(e instanceof Error?e.message:'Camera unavailable. Choose Photo Library instead.');}
  }
  function take() {
    if(count>0&&!capture)return;
    if(capture){onPhoto(blackReferenceFrame);return;}
    if(!ready){void enableCamera();return;}
    const saveFrame=()=>{
      if(!video.current?.videoWidth)return;
      const canvas=document.createElement('canvas');canvas.width=video.current.videoWidth;canvas.height=video.current.videoHeight;
      canvas.getContext('2d')?.drawImage(video.current,0,0);onPhoto(canvas.toDataURL('image/jpeg',.9));
    };
    if(count){if(timeout.current)clearTimeout(timeout.current);setCount(0);return;}
    function tick(n:number){setCount(n);if(n===0){saveFrame();return;}timeout.current=setTimeout(()=>tick(n-1),1000);}
    tick(timer);
  }
  return <Sheet title="Camera" className="native-photo-camera" onClose={onCancel}>
    <video ref={video} autoPlay playsInline muted/>
    {count>0&&<strong className="photo-countdown">{count}</strong>}
    {error&&<p className="camera-error" role="alert">{error}</p>}
    <div className="photo-camera-controls"><div className="photo-timer-row"><button aria-label="Flash" aria-pressed={flash} onClick={()=>setError("Camera flash is unavailable in this photo preview.")}>{flash?<Zap/>:<ZapOff/>}</button><div><Timer/>{[0,5,10].map(t=><button key={t} aria-pressed={timer===t} onClick={()=>setTimer(t)}>{t?t+'s':'Timer Off'}</button>)}</div></div><div className="photo-shutter-row"><button onClick={onCancel}>Cancel</button><button className={`photo-shutter ${count?'counting':''}`} aria-label={!capture&&!ready?'Enable camera':'Take photo'} onClick={take}><span/></button><button aria-label="Switch camera" onClick={()=>{const next=facing==='user'?'environment':'user';setFacing(next);if(ready)void enableCamera(next);}}><SwitchCamera/></button></div>{!capture&&!ready&&<button className="camera-enable" onClick={()=>void enableCamera()}><Camera size={16}/>Enable camera</button>}</div>
  </Sheet>;
}
