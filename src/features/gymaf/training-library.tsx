"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Clock3, Search, Star, X } from 'lucide-react';
import type { RelationshipDetail, ScheduledWorkout, WorkoutFavorite } from '@/shared/gymaf/contracts';
import { TrainingArtwork } from './client-views';
import { Dialog, Empty, ErrorNote, useCommand, useResource } from './ui';

export function TrainingLibrary({data,query}:{data:RelationshipDetail;query:string}) {
  const favorites=useResource<WorkoutFavorite[]>(`relationships/${data.relationship.id}/favorites`), mutation=useCommand();
  const clearError=mutation.clearError;
  // A successful reload replaces the data identity. Failed refreshes retain it and their error.
  useEffect(()=>{if(favorites.data)clearError();},[favorites.data,clearError]);
  return <TrainingLibraryView data={data} query={query} favorites={favorites.data} busy={mutation.busy} error={favorites.error||mutation.error} onRetry={favorites.reload} onFavorite={async(workout,favorite)=>{
    const saved=favorites.data?.find(f=>f.scheduled_id===workout.id);
    const result=await mutation.run('training.favorite',{scheduledId:workout.id,favorite,revision:saved?.revision||0});
    if(result)favorites.update(rows=>[...rows.filter(f=>f.scheduled_id!==workout.id),{scheduled_id:workout.id,favorite,revision:result.revision!}]);
  }}/>;
}
export function TrainingLibraryView({data,query,favorites,busy=false,error,onRetry,onFavorite}:{data:RelationshipDetail;query:string;favorites?:WorkoutFavorite[];busy?:boolean;error?:string;onRetry?:()=>void;onFavorite:(workout:ScheduledWorkout,favorite:boolean)=>void}) {
  const [search,setSearch]=useState(''),[tab,setTab]=useState('Your Workouts'),[duration,setDuration]=useState('All'),[filter,setFilter]=useState(false);
  const timed=(w:ScheduledWorkout)=>w.prescription.exercises.reduce((n,e)=>n+e.sets.reduce((s,v)=>s+(v.durationSeconds||0)+v.restSeconds,0),0);
  const workouts=data.workouts.filter(w=>w.state!=='canceled').filter(w=>(w.prescription.title+' '+w.prescription.exercises.map(e=>e.name).join(' ')).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    .filter(w=>tab!=='Favorites'||favorites?.some(f=>f.scheduled_id===w.id&&f.favorite))
    .filter(w=>duration==='All'||(duration==='Up to 30 min'?timed(w)>0&&timed(w)<=1800:timed(w)>1800));
  return <section className="connected-library"><header className="library-head"><Link href={'/app'+query} className="icon-button" aria-label="Close More Workouts"><X/></Link><h1>More Workouts</h1></header>
    <div className="tabs" role="group" aria-label="Workout library">{['Your Workouts','Favorites'].map(t=><button key={t} aria-pressed={tab===t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>
    <div className="connected-library-content"><label className="search-field"><Search size={20}/><input type="search" aria-label="Search workouts" placeholder="Search Workouts" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="filter-row"><button onClick={()=>setFilter(true)}><Clock3 size={18}/>{duration==='All'?'Timed work & rest':duration}<ChevronDown size={18}/></button></div>
    <ErrorNote message={error}/>{error&&onRetry&&<button className="button" disabled={busy} onClick={onRetry}>Reload Favorites</button>}
    <div className="section-intro"><h2>{tab}</h2><p>Assigned by {data.relationship.coach_name||'your coach'}</p></div>
    {tab==='Favorites'&&!favorites&&!error?<p role="status">Loading favorites…</p>:workouts.length?<div className="workout-grid">{workouts.map(w=>{const favorite=!!favorites?.some(f=>f.scheduled_id===w.id&&f.favorite);return <article key={w.id} className="workout-tile"><Link href={`/app/workouts/${w.id}${query}`}><TrainingArtwork/><h3>{w.prescription.title}</h3><p>{w.prescription.exercises.length} exercises · {w.scheduled_date}</p></Link><button className={'favorite '+(favorite?'is-favorite':'')} disabled={busy||!favorites} aria-label={`${favorite?'Unfavorite':'Favorite'} ${w.prescription.title}`} aria-pressed={favorite} onClick={()=>onFavorite(w,!favorite)}><Star size={22} fill={favorite?'currentColor':'none'}/></button></article>;})}</div>:<Empty><h2>{tab==='Favorites'?'No saved workouts':'No workouts found'}</h2><p>{!data.workouts.length?'Your coach’s assigned workouts will appear here.':'Try another search, clear your filter, or save a workout with its star.'}</p>{(search||duration!=='All')&&<button className="button" onClick={()=>{setSearch('');setDuration('All');}}>Clear Filters</button>}</Empty>}
    <p className="loaded-scope">Showing workouts from your loaded schedule. Timed work and rest excludes untimed repetitions.</p><Link className="row" href={'/app/schedule'+query}><span>Edit Schedule</span><ChevronRight/></Link></div>
    {filter&&<Dialog title="Timed Work & Rest" onClose={()=>setFilter(false)}><p>Filter by prescribed timed work and rest. This is not an estimate of total workout duration.</p><div className="member-choices">{['All','Up to 30 min','Over 30 min'].map(v=><button key={v} aria-pressed={duration===v} onClick={()=>{setDuration(v);setFilter(false);}}>{v}{v===duration&&<Check size={20}/>}</button>)}</div></Dialog>}
  </section>;
}
