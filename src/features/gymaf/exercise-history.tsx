"use client";
import { useState } from 'react';
import type { ExerciseHistory } from '@/shared/gymaf/contracts';
import { Pending, useResource } from './ui';

export function ExerciseHistoryPanel({sessionId,exerciseId}:{sessionId:string;exerciseId:string}) {
  const resource=useResource<ExerciseHistory>(`workout-sessions/${sessionId}/exercise-history/${exerciseId}`);
  return resource.data?<ExerciseHistoryView history={resource.data}/>:<Pending error={resource.error} reload={resource.reload}/>;
}
export function ExerciseHistoryView({history}:{history:ExerciseHistory}) {
  const [range,setRange]=useState('30 Days');
  const cutoff=range==='All'?0:Date.parse(history.as_of)-Number(range.split(' ')[0])*86400000;
  const entries=history.entries.filter(e=>Date.parse(e.completed_at)>=cutoff);
  return <div className="connected-exercise-history"><div className="segmented" role="group" aria-label="Exercise history range">{['30 Days','90 Days','All'].map(r=><button key={r} aria-pressed={range===r} className={range===r?'active':''} onClick={()=>setRange(r)}>{r}</button>)}</div>{entries.length?entries.map(e=><article key={e.id}><header><time dateTime={e.completed_at}>{new Date(e.completed_at).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</time></header><h3>{e.title}</h3>{e.sets.map(s=><p key={s.set_index}>Set {s.set_index+1}: {s.skipped?'Skipped':[s.actual_reps!==null?`${s.actual_reps} reps`:'',s.load_kg!==null?`${s.load_kg} kg`:'',s.duration_seconds!==null?`${s.duration_seconds}s`:'',s.distance_m!==null?`${s.distance_m}m`:''].filter(Boolean).join(' · ')||'No values recorded'}</p>)}</article>):<p className="empty-state">No completed sets recorded for this exercise in this period.</p>}{history.has_more&&<p className="note">Showing the 100 most recent completed attempts for this exercise.</p>}</div>;
}
