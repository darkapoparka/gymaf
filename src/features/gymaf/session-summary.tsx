"use client";
import Link from '@/components/capture-link';
import { useRef, useState, type ReactNode } from 'react';
import { Check, ChevronRight, Dumbbell, List, X } from 'lucide-react';
import type { SessionDetail } from '@/shared/gymaf/contracts';
import { Dialog } from './ui';

export function SessionSummary({detail,back,renderSets,feedback,feedbackDirty=false,initialTab="Summary",onDirtyExit}:{detail:SessionDetail;back:string;renderSets:(id:string)=>ReactNode;feedback?:ReactNode;feedbackDirty?:boolean;initialTab?:string;onDirtyExit?:(href:string)=>void}) {
  const [tab,setTab]=useState(initialTab),[exerciseId,setExerciseId]=useState(''),[template,setTemplate]=useState(0);
  const carousel=useRef<HTMLDivElement>(null);
  const {session,sets}=detail;
  const exercise=session.prescription.exercises.find(e=>e.id===exerciseId);
  const performed=sets.filter(s=>!s.skipped&&((s.actual_reps||0)>0||(s.duration_seconds||0)>0||(s.distance_m||0)>0));
  const date=new Date(session.completed_at||session.started_at);
  const duration=Math.floor(session.elapsed_seconds/60)+':'+String(session.elapsed_seconds%60).padStart(2,'0');
  function selectTemplate(index:number){const track=carousel.current;if(!track)return;const card=track.children[index] as HTMLElement;track.scrollTo({left:card.offsetLeft-(track.children[0] as HTMLElement).offsetLeft,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});setTemplate(index);}
  return <section className="connected-session-summary"><header className="native-titlebar"><Link href={back} className="icon-button" aria-label="Close Summary" onClick={event=>{if(feedbackDirty){event.preventDefault();setTab('Feedback');onDirtyExit?.(back);}}}><X/></Link><h1>{date.toLocaleDateString(undefined,{month:'short',day:'numeric'})} · {date.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</h1><span/></header>
    <div className="tabs" role="group" aria-label="Workout summary">{(feedback?['Summary','Feedback','Exercises']:['Summary','Exercises']).map(t=><button key={t} className={t===tab?'active':''} aria-pressed={t===tab} onClick={()=>setTab(t)}>{t}{t==='Exercises'&&<small>{session.prescription.exercises.length}</small>}</button>)}</div>
    {feedback&&<div hidden={tab!=='Feedback'}>{feedback}</div>}
    {tab==='Summary'?<><div ref={carousel} className="connected-summary-carousel" aria-label="Summary card styles" onScroll={e=>{const track=e.currentTarget;const step=(track.children[1] as HTMLElement).offsetLeft-(track.children[0] as HTMLElement).offsetLeft;setTemplate(Math.round(track.scrollLeft/step));}}>
      {[0,1].map(style=><article className={'connected-summary-card template-'+style} key={style} aria-label={'Summary card '+(style+1)}><header><span className="wordmark">Gymaf</span><span><Check size={16}/>{session.state==='completed'?'Complete':'Ended'}</span></header><div className="summary-card-values">{style===0&&<div className="summary-secondary"><b>{performed.length}</b><small>Performed Sets</small></div>}<div className="summary-duration"><b>{duration}</b><small>Duration</small></div></div><div className="summary-card-caption"><span>{session.prescription.title}</span><time dateTime={date.toISOString()}>{date.toLocaleDateString()}</time></div></article>)}
    </div><div className="summary-pagination" role="group" aria-label="Summary card selection">{[0,1].map(i=><button key={i} aria-label={'Show summary card '+(i+1)} aria-pressed={template===i} onClick={()=>selectTemplate(i)}><span/></button>)}</div><footer className="summary-footer"><button className="icon-button" aria-label="View exercise breakdown" onClick={()=>setTab('Exercises')}><List/></button><Link className="button primary full" onClick={event=>{if(feedbackDirty){event.preventDefault();setTab('Feedback');onDirtyExit?.('/app/check-ins?relationship='+session.relationship_id);}}} href={'/app/check-ins?relationship='+session.relationship_id}>Weekly Check-in</Link></footer></>:tab==='Exercises'?<div className="connected-summary-exercises"><h2>{session.prescription.title}</h2>{session.prescription.exercises.map(e=><button key={e.id} onClick={()=>setExerciseId(e.id)}><span className="exercise-glyph"><Dumbbell/></span><span><b>{e.name}</b><small>{sets.filter(s=>s.exercise_id===e.id).length} of {e.sets.length} sets recorded</small></span><ChevronRight/></button>)}</div>:null}
    {exercise&&<Dialog title={exercise.name} onClose={()=>setExerciseId('')}><p className="gymaf-pre">{exercise.instructions}</p>{renderSets(exercise.id)}</Dialog>}
  </section>;
}
