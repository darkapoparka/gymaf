"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Check, Images } from "lucide-react";
import { useCaptureState } from "@/lib/capture-context";
import { coverChoices } from "@/lib/reference-media";
import { useLocalData } from "@/lib/store";
import { photoData } from "@/lib/media-store";
import { Back, Photo } from "./primitives";
import { useAppRouter } from "./capture-link";

export function CoverPicker() {
  const { data, update } = useLocalData();
  const router = useAppRouter();
  const [loaded,setLoaded] = useCaptureState("cover.loaded",true);
  const [selection,setSelection] = useCaptureState("cover.selection",data.preferences.coverChoice || "");
  const [upload,setUpload] = useState(data.preferences.coverPhoto || "");
  const [error,setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  async function choose(file?: File) {
    if (!file) return;
    try { setUpload(await photoData(file)); setSelection("upload"); setLoaded(true); }
    catch(e) { setError(e instanceof Error ? e.message : "Could not open this photo."); }
  }
  function save() {
    update(s => ({preferences:{...s.preferences,coverChoice:selection,coverPhoto:selection === "upload" ? upload : "",coverZoom:"1"}}));
    router.push("/profile/edit");
  }
  return <section className="cover-picker">
    <header><Back href="/profile/edit"/><h1>Edit Cover Photo</h1><button className="icon-button primary" aria-label="Save cover photo" disabled={!selection} onClick={save}><Check size={27}/></button></header>
    <input ref={input} type="file" accept="image/*" className="visually-hidden" onChange={e=>void choose(e.target.files?.[0])}/>
    <div className="cover-choice-grid">
      <button className="cover-upload" aria-label="Choose your own cover photo" onClick={()=>{setLoaded(true);input.current?.click();}}><Images size={35}/></button>
      {loaded && coverChoices.map(choice=><button key={choice.id} aria-label={choice.label} aria-pressed={selection===choice.id} onClick={()=>setSelection(choice.id)}><Photo crop={choice.crop} alt={choice.label} priority/>{selection===choice.id && <span className="cover-check"><Check size={18}/></span>}</button>)}
      {upload && <button aria-label="Uploaded cover" aria-pressed={selection==='upload'} onClick={()=>setSelection('upload')}><Image src={upload} alt="Your uploaded cover" width={300} height={200} unoptimized/></button>}
    </div>
    {error && <p role="alert">{error}</p>}
  </section>;
}
