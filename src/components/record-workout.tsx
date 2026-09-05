"use client";
import { useEffect, useRef, useState } from "react";
import Link from "./capture-link";
import { Circle, Square, X, Share2, SwitchCamera, ZapOff, Zap, Volume2, VolumeX, ChevronRight } from "lucide-react";
import { useCapture, useCaptureState } from "@/lib/capture-context";
import { Photo, Sheet } from "./primitives";
import { CaptureStatus } from "./capture-status";
import { type Workout } from "@/lib/data";
import { useLocalData } from "@/lib/store";
import { readVideo, saveVideo } from "@/lib/video-store";

export function SavedVideo({ id }: { id: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    let url = "";
    readVideo(id)
      .then((blob) => {
        if (blob && active) {
          url = URL.createObjectURL(blob);
          setSrc(url);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);
  return src ? (
    <video controls playsInline src={src} className="saved-video" />
  ) : (
    <p className="note">Video unavailable on this device.</p>
  );
}
export function RecordWorkout({ workout: w }: { workout: Workout }) {
  const { update } = useLocalData();
  const capture = useCapture();
  const [facing,setFacing] = useState<"user"|"environment">("user");
  const flash = false;
  const muted = false;
  const [position,setPosition] = useState(30);
  const playback = useRef<HTMLVideoElement>(null);
  const preview = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    recorder = useRef<MediaRecorder | null>(null),
    chunks = useRef<Blob[]>([]);
  const [state, setState] = useCaptureState("record.state", "ready"),
    [seconds, setSeconds] = useCaptureState("record.seconds", 0),
    [error, setError] = useState(""),
    [src, setSrc] = useState(""),
    [blob, setBlob] = useState<Blob | null>(null);
  useEffect(
    () => () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  useEffect(() => {
    if (!src) return;
    return () => URL.revokeObjectURL(src);
  }, [src]);
  useEffect(() => {
    if (state !== "recording" || capture) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state, capture, setSeconds]);
  async function start() {
    setError("");
    if (capture) { setSeconds(0); setState("recording"); return; }
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
        throw new Error(
          "Recording is unavailable in this browser. Try a browser with camera support.",
        );
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: true,
      });
      stream.current = media;
      if (preview.current) {
        preview.current.srcObject = media;
        await preview.current.play();
      }
      const recording = new MediaRecorder(media);
      recorder.current = recording;
      chunks.current = [];
      recording.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      recording.onstop = () => {
        const file = new Blob(chunks.current, { type: recording.mimeType });
        setBlob(file);
        setSrc(URL.createObjectURL(file));
        setState("preview");
        media.getTracks().forEach((t) => t.stop());
      };
      recording.start();
      setSeconds(0);
      setState("recording");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera unavailable.");
      stream.current?.getTracks().forEach((t) => t.stop());
    }
  }
  async function send() {
    if (capture) { setState("saved"); return; }
    if (!blob) return;
    try {
      const id = crypto.randomUUID();
      await saveVideo(id, blob);
      update((s) => ({
        messages: [
          ...s.messages,
          { id, text: `Workout video: ${w.title}`, video: id },
        ],
      }));
      setState("saved");
    } catch {
      setError(
        "Could not save your video. Your recording is still available to download.",
      );
    }
  }
  const exercising = state === "ready" || state === "recording";
  const exerciseCrop = { src: `screens/${state === "recording" ? "452442b79e2166cf" : "03c8df3d92da317a"}.webp`, sw:902, sh:2048, x:55, y:1640, w:183, h:182 };
  return <div className={`record-page record-state-${state}`}>
    <CaptureStatus light/>
    <video ref={preview} muted autoPlay playsInline className={exercising ? "record-preview" : "hidden"}/>
    {src && !exercising && <video ref={playback} src={src} controls playsInline className="record-preview"/>}
    <header>
      {state === "recording" ? <span className="record-elapsed"><i/>{String(Math.floor(seconds/60)).padStart(2,"0")}:{String(seconds%60).padStart(2,"0")}</span> : <>
        {state === "ready" && <><button aria-label="Switch camera" onClick={()=>setFacing(facing==='user'?'environment':'user')}><SwitchCamera/></button><button aria-label="Flash" aria-pressed={flash} onClick={()=>setError("Camera flash is unavailable in this recording preview.")}>{flash?<Zap/>:<ZapOff/>}</button></>}
        <Link href={`/workouts/${w.id}/session`} className="record-close" aria-label="Close recording"><X/></Link>
      </>}
    </header>
    <footer>
      <div className="record-action">
        {state === "ready" ? <button onClick={()=>void start()} className="record-button"><Circle/>Record</button> : state === "recording" ? <button className="record-button" onClick={()=>{if(capture)setState('preview');else recorder.current?.stop();}}><span className="record-stop"><Square fill="currentColor"/></span>Stop Recording</button> : state === "preview" ? <button className="button" onClick={()=>setState('send')}>Next <ChevronRight size={21}/></button> : null}
      </div>
      {exercising && <div className={`record-exercise ${state==='recording'?'dimmed':''}`}><Photo priority crop={exerciseCrop} alt="Modified Plyo Push-Up exercise demonstration"/><b>Modified Plyo Push-Up</b><button aria-label={muted?'Unmute exercise':'Mute exercise'} aria-pressed={muted} onClick={()=>setError("The captured exercise has no audio track to mute.")}>{muted?<VolumeX/>:<Volume2/>}</button></div>}
      {state==='preview'&&<label className="record-timeline"><span className="visually-hidden">Recording playback position</span><input type="range" min="0" max="100" value={position} onChange={e=>{setPosition(Number(e.target.value));const player=playback.current;if(player?.duration)player.currentTime=player.duration*Number(e.target.value)/100;}}/><i style={{left:position+'%'}}/></label>}
      {error&&<p role="alert">{error}</p>}
    </footer>
    {state==='send'&&<Sheet title="Share recording" className="record-share-dialog" onClose={()=>setState('preview')}><CaptureStatus light/><button className="button primary full" onClick={()=>void send()}>Send to Lee</button>{src?<a href={src} download="workout-recording.webm" className="button full"><Share2 size={18}/>More Options</a>:<button className="button full" onClick={()=>setError('The reference contains a black video frame; an original video file is not available.')}><Share2 size={18}/>More Options</button>}{error&&<p role="status">{error}</p>}</Sheet>}
    {state==='saved'&&<Sheet title="Video saved on this device" onClose={()=>setState('preview')}><p>Coach delivery is not connected.</p><Link href="/messages/videos" className="button full">View Videos</Link><Link href={`/workouts/${w.id}/session`} className="button primary full">Return to Workout</Link></Sheet>}
  </div>;
}
