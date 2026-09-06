"use client";
import { useEffect, useRef, useState } from 'react';
import { Dumbbell, Flag, History, Layers, List, Pause, Play, Video, Volume2, ChevronRight } from 'lucide-react';
import { useBackend } from '@/lib/backend/context';
import { media } from '@/lib/data';
import type { Props } from '@/features/gymaf/session-view';
import { Photo, IconButton, Sheet, Row } from '../primitives';
import Link from '../capture-link';

/** Original player layout with the shared session controller's real commands and editors. */
export function TemplateSession({detail,elapsed,back,dirty,busy,error,preferences={},onTransition,renderSets,renderFlag,renderRecording,renderHistory}:Props) {
  const backend=useBackend()!, [index,setIndex]=useState(0),[sheet,setSheet]=useState('');
  const [countdown,setCountdown]=useState<number|null>(null),audio=useRef<AudioContext|null>(null);
  useEffect(()=>()=>{void audio.current?.close();},[]);
  useEffect(()=>{if(countdown===null)return;const timer=setTimeout(()=>{if(countdown>1)setCountdown(countdown-1);else{setCountdown(null);setIndex(i=>Math.min(i+1,detail.session.prescription.exercises.length-1));}},1000);return()=>clearTimeout(timer);},[countdown,detail.session.prescription.exercises.length]);
  function nextExercise() {
    if(index>=detail.session.prescription.exercises.length-1){setSheet('Finish workout');return;}
    if(preferences.vibration&&'vibrate' in navigator)navigator.vibrate(80);
    try {const context=audio.current||(audio.current=new AudioContext());void context.resume().catch(()=>undefined);const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=preferences.tone==='Beep'?'sine':'triangle';oscillator.frequency.value=preferences.tone==='Beep'?880:523.25;gain.gain.setValueAtTime(.06,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.25);oscillator.connect(gain);gain.connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+.25);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}catch{}
    if(preferences.countdown)setCountdown(3);else setIndex(i=>i+1);
  }
  const exercise=detail.session.prescription.exercises[index],paused=detail.session.state==='paused';
  const artwork=backend.workouts.find(w=>w.id===detail.session.scheduled_workout_id)?.image || media.home;
  const count=detail.session.prescription.exercises.reduce((n,e)=>n+e.sets.length,0),locked=busy||dirty||countdown!==null;
  const target=exercise.sets[0];
  const performed=detail.sets.some(s=>!s.skipped&&((s.actual_reps||0)>0||(s.duration_seconds||0)>0||(s.distance_m||0)>0));
  const close=()=>{if(!locked)setSheet('');};
  return <div className="session template-session"><div className="workout-backdrop"><Photo crop={artwork} alt={detail.session.prescription.title} priority/></div>
    <header className="session-top" inert={paused&&!sheet}><Link className="icon-button" href={back} onClick={event=>{if(locked)event.preventDefault();}} aria-label="Back to workout"><ChevronRight style={{transform:'rotate(180deg)'}}/></Link><div><div className="progress-track"><span style={{width:`${detail.sets.length/(count||1)*100}%`}}/></div><b>{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')}</b><span>{detail.sets.length}/{count} sets saved</span></div><IconButton label={paused?'Resume workout':'Pause workout'} disabled={locked} onClick={()=>onTransition(paused?'in_progress':'paused')}>{paused?<Play/>:<Pause/>}</IconButton></header>
    <section className="exercise-panel" inert={paused&&!sheet}><h2>{exercise.name}</h2><p>Exercise {index+1} of {detail.session.prescription.exercises.length}</p><div className="exercise-timer"><IconButton label="Exercise list" disabled={locked} onClick={()=>setSheet('Overview')}><List/></IconButton><strong>{target.reps!==null?`${target.reps} reps`:target.durationSeconds!==null?`${target.durationSeconds}s`:`${target.distanceM}m`}</strong><IconButton label="Next exercise" disabled={locked} onClick={nextExercise}><ChevronRight/></IconButton></div>
      <div className="exercise-actions"><button disabled={locked} onClick={()=>setSheet('Log sets')}><Dumbbell/>Weight</button><button disabled={locked} onClick={()=>setSheet('Log sets')}><Layers/>Reps</button><button disabled={locked} onClick={()=>setSheet('Record')}><Video/>Record</button><button disabled={locked} onClick={()=>setSheet('Flag')}><Flag/>Flag</button><button disabled={locked} onClick={()=>setSheet('Guide')}><Volume2/>Guide</button><button disabled={locked} onClick={()=>setSheet('History')}><History/>History</button></div>
      {error&&<p role="alert" className="note">{error}</p>}<button className="button primary full" disabled={busy} onClick={()=>setSheet('Log sets')}>Log Sets</button><button className="text-button" disabled={locked} onClick={()=>setSheet('Finish workout')}>End Workout</button>
    </section>
    {countdown!==null&&<div className="player-countdown" role="status"><strong>{countdown}</strong><span>Next exercise</span><button className="button" onClick={()=>setCountdown(null)}>Cancel</button></div>}
    {paused&&!sheet&&<div className="pause-overlay" role="dialog" aria-modal="true" aria-label="Workout paused" onKeyDown={event=>{if(event.key!=="Tab")return;const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a,button:not(:disabled)"));const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}}><Link className="icon-button template-player-exit" href={back} aria-label="Close workout"><ChevronRight style={{transform:"rotate(180deg)"}}/></Link><h1>Workout Paused</h1><button className="button" disabled={locked} onClick={()=>onTransition('in_progress')}><Play/>Resume</button><button className="button" onClick={()=>setSheet('Finish workout')}>End Workout</button></div>}
    {sheet==='Record'?renderRecording?.(exercise.id,close):sheet==='Flag'?renderFlag?.(exercise.id,close):sheet&&<Sheet title={sheet} onClose={close}>{sheet==='Log sets'?<><details key={`${exercise.id}:${preferences.instructions==='Every Time'?detail.sets.length:''}`} open={preferences.instructions!=='Never'}><summary>Exercise Instructions</summary><p>{exercise.instructions}</p></details>{renderSets(exercise.id)}{dirty&&<p role="status">Save your edited sets before closing.</p>}</>:sheet==='Overview'?<div className="row-group">{detail.session.prescription.exercises.map((e,i)=><Row key={e.id} detail={`${e.sets.length} sets`} onClick={()=>{setIndex(i);close();}}>{e.name}</Row>)}</div>:sheet==='Guide'?<p>{exercise.instructions||'Your coach has not added instructions for this exercise.'}</p>:sheet==='History'?renderHistory?.(exercise.id):<><h2>Finish your workout?</h2><p>Only saved sets will appear in your history.</p>{!performed&&<p>Log a performed set to complete this workout.</p>}<button className="button primary full" disabled={locked||!performed} onClick={()=>onTransition('completed')}>Yes, Finish Workout</button><button className="button full" disabled={locked} onClick={()=>{if(window.confirm('End this attempt without marking it completed?'))onTransition('abandoned');}}>End Without Completion</button></>}{error&&<p className="note" role="alert">{error}</p>}</Sheet>}
  </div>;
}
