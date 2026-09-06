"use client";
import { useEffect, useRef, useState } from 'react';
import { Circle, Mic, MicOff, RefreshCw, Square } from 'lucide-react';
import { Dialog, ErrorNote } from './ui';

export function VideoRecorder({exerciseName,onVideo,onClose}:{exerciseName?:string;onVideo:(file:File)=>void;onClose:()=>void}){
 const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),recorder=useRef<MediaRecorder|null>(null),generation=useRef(0),ticker=useRef<ReturnType<typeof setInterval>|null>(null);
 const [ready,setReady]=useState(false),[recording,setRecording]=useState(false),[file,setFile]=useState<File|null>(null),[seconds,setSeconds]=useState(0),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[sound,setSound]=useState(false),[facing,setFacing]=useState<'user'|'environment'>('user'),[discard,setDiscard]=useState(false);
 const [saving,setSaving]=useState(false),busy=useRef(false);
 useEffect(()=>{
  const id=++generation.current;
  const opening=typeof navigator.mediaDevices?.getUserMedia==='function'&&typeof MediaRecorder!=='undefined'?navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:640},height:{ideal:480}},audio:sound}):Promise.reject(new Error('This browser does not support recording. Choose a video from your library.'));
  void opening.then(async next=>{if(generation.current!==id){next.getTracks().forEach(track=>track.stop());return;}stream.current=next;if(video.current){video.current.srcObject=next;await video.current.play();}if(generation.current===id)setReady(true);next.getVideoTracks()[0].onended=()=>{if(generation.current===id){if(recorder.current?.state==='recording')recorder.current.stop();setReady(false);setError('Camera disconnected. You can keep any recorded clip or retry.');}};}).catch(failure=>{if(generation.current===id){stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;setError(failure instanceof DOMException&&failure.name==='NotAllowedError'?'Camera or microphone access was denied. Allow access and Retry, or choose a file from your library.':'The camera could not open. Retry or use your photo/video library.');}});
  return()=>{generation.current=id+1;if(ticker.current)clearInterval(ticker.current);if(recorder.current&&recorder.current.state!=='inactive')recorder.current.stop();stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;};
 },[attempt,facing,sound]);
 useEffect(()=>{if(!file||!video.current)return;const url=URL.createObjectURL(file);video.current.srcObject=null;video.current.src=url;return()=>URL.revokeObjectURL(url);},[file]);
 useEffect(()=>{if(!recording&&!file)return;const warn=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[recording,file]);
 useEffect(()=>{const hidden=()=>{if(document.visibilityState==='hidden'&&recorder.current?.state==='recording')recorder.current.stop();};document.addEventListener('visibilitychange',hidden);return()=>document.removeEventListener('visibilitychange',hidden);},[]);
 function restart(){setError('');setFile(null);setReady(false);setSeconds(0);setAttempt(n=>n+1);}
 function record(){
  if(!ready||!stream.current||busy.current)return;
  busy.current=true;setError('');const id=generation.current,chunks:Blob[]=[];let size=0,tooLarge=false;
  const mime=['video/webm;codecs=vp8,opus','video/webm','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
  if(!mime){busy.current=false;setError('No supported recording format is available. Use your video library.');return;}
  try{
   const next=new MediaRecorder(stream.current,{mimeType:mime,videoBitsPerSecond:650000,audioBitsPerSecond:64000});recorder.current=next;
   next.ondataavailable=event=>{if(event.data.size){size+=event.data.size;if(size>3800000){tooLarge=true;if(next.state==='recording')next.stop();}else chunks.push(event.data);}};
   next.onerror=()=>{if(generation.current===id)setError('Recording failed. Try a shorter clip.');};
   next.onstop=()=>{if(ticker.current)clearInterval(ticker.current);busy.current=false;stream.current?.getTracks().forEach(track=>track.stop());if(generation.current!==id)return;setRecording(false);setReady(false);setSaving(false);if(tooLarge||!size){setError(tooLarge?'The recording exceeded 4 MB. Retake a shorter clip.':'The recording was empty. Retry.');return;}const type=mime.startsWith('video/mp4')?'video/mp4':'video/webm';setFile(new File(chunks,'workout-recording.'+(type==='video/mp4'?'mp4':'webm'),{type}));};
   next.start(250);setRecording(true);setSeconds(0);const started=performance.now();
   ticker.current=setInterval(()=>{const elapsed=Math.floor((performance.now()-started)/1000);if(generation.current===id)setSeconds(Math.min(elapsed,30));if(elapsed>=30&&next.state==='recording'){setSaving(true);next.stop();}},250);
  }catch{busy.current=false;setError('Recording could not start. Retry or use a file from your library.');}
 }
 function stop(){if(recorder.current?.state==='recording'){setSaving(true);recorder.current.stop();}}
 function close(){if(recording||file)setDiscard(true);else onClose();}
 return <><Dialog title="Record Exercise" className="connected-camera connected-video-recorder" onClose={close}><video ref={video} autoPlay={!file} muted={!file} playsInline controls={!!file} aria-label={file?'Recorded video preview':'Live recording preview'}/>{!ready&&!file&&!error&&!recording&&<p className="camera-status" role="status">Opening camera…</p>}{recording&&<p className="recording-time" role="status"><Circle size={9} fill="currentColor"/>{`00:${String(seconds).padStart(2,'0')}`}</p>}<div className="camera-controls"><ErrorNote message={error}/><p className="recording-exercise">{exerciseName||'Video message'}</p><p className="recording-limit">Up to 30 seconds · private until you send</p>{file?<><button className="button primary full" onClick={()=>onVideo(file)}>Next</button><button className="button full" onClick={restart}>Retake</button></>:<><div className="camera-options"><button className="icon-button" aria-label={sound?'Record sound on':'Record sound off'} aria-pressed={sound} disabled={recording||saving} onClick={()=>{setReady(false);setError('');setSound(value=>!value);}}>{sound?<Mic/>:<MicOff/>}</button><button className="icon-button" aria-label="Switch recording camera" disabled={!ready||recording||saving} onClick={()=>{setReady(false);setFacing(value=>value==='user'?'environment':'user');}}><RefreshCw/></button></div>{recording?<button className="recording-action" disabled={saving} onClick={stop}><Square size={18} fill="currentColor"/>{saving?'Finishing…':'Stop Recording'}</button>:<button className="recording-action" disabled={!ready} onClick={record}><Circle size={18}/>Record</button>}{error&&<button className="button" onClick={restart}>Retry Recording</button>}</>}</div></Dialog>{discard&&<Dialog title="Discard this recording?" onClose={()=>setDiscard(false)}><p>This clip has not been uploaded or shared.</p><button className="button primary" onClick={()=>setDiscard(false)}>Keep Recording</button><button className="button" onClick={onClose}>Discard Recording</button></Dialog>}</>;
}
