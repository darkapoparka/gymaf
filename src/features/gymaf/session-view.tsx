"use client";
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, List, Pause, Play, X } from 'lucide-react';
import type { SessionDetail, SessionState } from '@/shared/gymaf/contracts';
import { Dialog, ErrorNote } from './ui';
import { TrainingArtwork, type Artwork } from './client-views';

type Props = {
  detail: SessionDetail; elapsed: number; back: string; dirty: boolean; busy: boolean;
  error?: string; artwork?: Artwork; onTransition: (state: SessionState) => void;
  renderSets: (exerciseId: string) => ReactNode;
};

/** Presentation only. Every acknowledgement and state transition belongs to SessionScreen. */
export function SessionView({ detail, elapsed, back, dirty, busy, error, artwork, onTransition, renderSets }: Props) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [sheet, setSheet] = useState<'overview' | 'sets' | 'finish' | null>(null);
  const { session, sets, editable } = detail;
  const exercises = session.prescription.exercises;
  const exercise = exercises[Math.min(index, exercises.length - 1)];
  const paused = session.state === 'paused';
  const locked = dirty || busy;
  const logged = sets.filter(set => set.exercise_id === exercise.id).length;
  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0);
  const performed = sets.some(s => !s.skipped && ((s.actual_reps || 0) > 0 || (s.duration_seconds || 0) > 0 || (s.distance_m || 0) > 0));
  const close = () => { if (!locked) setSheet(null); };
  return <section className={`connected-player ${paused ? 'is-paused' : ''}`}>
    <TrainingArtwork artwork={artwork}/>
    <header className="connected-player-top">
      {dirty ? <button className="icon-button" disabled aria-label="Save edited sets before leaving"><X/></button> : <Link href={back} className="icon-button" aria-label="Back to history"><X/></Link>}
      <div><progress max={totalSets || 1} value={sets.length} aria-label="Saved workout sets"/><div className="player-time"><span aria-label="Elapsed time">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span><span>{sets.length}/{totalSets} sets logged</span></div></div>
      {editable ? <button className="icon-button" disabled={locked} onClick={() => onTransition(paused ? 'in_progress' : 'paused')} aria-label={paused ? 'Resume workout' : 'Pause workout'}>{paused ? <Play/> : <Pause/>}</button> : <Check aria-label={session.state}/>}
    </header>
    {paused && <h1 className="player-paused-title">Workout Paused</h1>}
    {!editable && <div className="player-paused-title"><h1>{session.state === 'completed' ? 'Workout Complete' : 'Workout Ended'}</h1><p>{session.prescription.title}</p></div>}
    <div className="connected-player-controls">
      <button className="player-handle" aria-label={expanded ? "Collapse workout controls" : "Expand workout controls"} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}/>
      <h2>{exercise.name}</h2>
      <div className="player-exercise-nav">
        <button className="icon-button" disabled={locked} onClick={() => setSheet('overview')} aria-label="Workout overview"><List/></button>
        <button className="player-log-sets" disabled={busy} aria-label={editable ? "Log Sets" : "View Sets"} onClick={() => setSheet("sets")}><span>{logged}/{exercise.sets.length} sets logged</span><small>Exercise {index + 1} of {exercises.length} · {editable ? "Log Sets" : "View Sets"}</small></button>
        <button className="icon-button" disabled={locked || index === exercises.length - 1} onClick={() => setIndex(index + 1)} aria-label="Next exercise"><ChevronRight/></button>
      </div>
      {expanded && <div className="player-action-row">
        <button className="button" disabled={locked || index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft size={18}/>Previous</button>
        <button className="button primary" disabled={busy} onClick={() => setSheet('sets')}>{editable ? 'Log Sets' : 'View Sets'}</button>
      </div>}
      <ErrorNote message={error}/>
      {editable && expanded && <button className="player-finish" disabled={locked} onClick={() => setSheet('finish')}>Finish Workout</button>}
    </div>
    {sheet === 'overview' && <Dialog title="Workout Overview" onClose={close}><div className="player-overview">{exercises.map((item, i) => <button key={item.id} onClick={() => { setIndex(i); setSheet(null); }} aria-current={i === index ? 'step' : undefined}><span><b>{item.name}</b><small>{item.sets.length} sets</small></span><ChevronRight/></button>)}</div></Dialog>}
    {sheet === 'sets' && <Dialog title={exercise.name} onClose={close}><p className="gymaf-pre">{exercise.instructions}</p><p className="note">Record what you performed. Blank values remain unrecorded.</p>{renderSets(exercise.id)}{dirty && <p role="status">Save every edited set before closing.</p>}</Dialog>}
    {sheet === 'finish' && <Dialog title="Finish Workout" onClose={close}><p>{sets.length} of {totalSets} sets logged.</p>{!performed && <p>Log a performed set to complete this workout.</p>}<ErrorNote message={error}/><button className="button primary full" disabled={locked || !performed} onClick={() => onTransition('completed')}>{busy ? 'Saving…' : 'Complete Workout'}</button><button className="button full" disabled={locked} onClick={() => { if (window.confirm('End this attempt without marking the workout completed?')) onTransition('abandoned'); }}>End Without Completion</button></Dialog>}
  </section>;
}
