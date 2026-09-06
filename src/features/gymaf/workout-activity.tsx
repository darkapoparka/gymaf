"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronDown, Pause, Play } from 'lucide-react';
import type { RelationshipDetail, SessionDetail } from '@/shared/gymaf/contracts';
import { elapsedSeconds } from '@/shared/gymaf/validation';
import { ErrorNote, Pending, useCommand, useResource } from './ui';

function ActivitySession({id,compact,query}:{id:string;compact:boolean;query:string}){
 const resource=useResource<SessionDetail>(`workout-sessions/${id}`),mutation=useCommand(),[now,setNow]=useState(0),[expanded,setExpanded]=useState(!compact);
 const reload=resource.reload;
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000),refresh=setInterval(reload,15000);return()=>{clearInterval(timer);clearInterval(refresh);};},[reload]);
 if(!resource.data)return <Pending error={resource.error} reload={reload}/>;
 const session=resource.data.session,elapsed=elapsedSeconds(session,now||Date.parse(session.started_at)),isRunning=session.state==='in_progress';
 const time=`${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;
 return <article className={`workout-activity-card ${compact?'activity-island':''}`}><button className="activity-expand" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}><span>{session.prescription.title}</span><time>{time}</time><ChevronDown size={18}/></button>{expanded&&<div className="activity-expanded"><p>{session.prescription.exercises.length} planned exercises</p><div><span>{session.state.replaceAll('_',' ')}</span>{resource.data.editable&&<button className="icon-button" disabled={mutation.busy} aria-label={isRunning?'Pause workout':'Resume workout'} onClick={async()=>{if(await mutation.run('session.transition',{sessionId:id,revision:session.revision,state:isRunning?'paused':'in_progress'}))reload();}}>{isRunning?<Pause size={18}/>:<Play size={18}/>}</button>}</div><Link href={`/app/sessions/${id}${query}`}>Open Workout</Link><ErrorNote message={mutation.error||resource.error}/>{(mutation.error||resource.error)&&<button className="button" onClick={reload}>Refresh Workout</button>}</div>}</article>;
}
export function LaunchScreen({query}:{query:string}){return <section className="gymaf-launch"><h1>Gymaf</h1><Link className="button primary" href={`/app${query}`}>Continue to Your Training</Link></section>;}
export function WorkoutActivity({data,mode,query}:{data:RelationshipDetail;mode:string;query:string}){
 const current=data.sessions.find(s=>s.state==='in_progress'||s.state==='paused'),completed=data.sessions.filter(s=>s.state==='completed').sort((a,b)=>Date.parse(b.completed_at||b.started_at)-Date.parse(a.completed_at||a.started_at));
 const latest=completed[0];
 if(mode==='launch')return <LaunchScreen query={query}/>;
 return <section className="workout-activity-page"><header className="native-titlebar"><Link className="icon-button" href={`/app/profile${query}`} aria-label="Back"><ChevronLeft/></Link><h1>{mode==='widgets'?'Workout Summary':'Workout Activity'}</h1><span/></header>{mode==='widgets'?<>{latest?<><article className="workout-summary-widget"><header><Check size={20}/><h2>Workout Complete</h2></header><h3>{latest.prescription.title}</h3><div><p><strong>{Math.round(latest.elapsed_seconds/60)}</strong><span>Active minutes</span></p><p><strong>{latest.prescription.exercises.length}</strong><span>Planned exercises</span></p></div><Link href={`/app/sessions/${latest.id}${query}`}>See Details</Link></article><article className="workout-summary-widget small"><h2>Workout Complete</h2><strong>{Math.round(latest.elapsed_seconds/60)} min</strong><Link href={`/app/sessions/${latest.id}${query}`}>See Details</Link></article></>:<p>Complete a workout to see your summary here.</p>}</>:current?<ActivitySession id={current.id} compact={mode==='dynamic-island'} query={query}/>:<p>No workout is currently running. Start one from your schedule.</p>}<p className="activity-scope">This view updates while Gymaf is open in your browser.</p><Link className="button" href={`/app/schedule${query}`}>Open Schedule</Link></section>;
}
