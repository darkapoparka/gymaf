"use client";
import { useEffect, useState } from "react";
import { useAppRouter as useRouter } from '@/components/capture-link';

import type { MemberRecord, PlanSet, SessionDetail, SetLog, SessionState } from "@/shared/gymaf/contracts";
import { preferenceDefaults } from "@/shared/gymaf/member-preferences";
import { ExerciseHistoryPanel } from "./exercise-history";
import { SessionFeedbackPanel, SessionFlagPanel } from "./session-feedback";
import { SessionSummary } from "./session-summary";
import { SessionView } from "./session-view";
import { TemplateSession } from '@/components/backend/session';
import { useBackend } from '@/lib/backend/context';
import { AttachmentComposer } from './conversation-media';
import { elapsedSeconds } from "@/shared/gymaf/validation";
import { ErrorNote, Field, Note, Pending, useCommand, useResource } from "./ui";

function SetEditor({ sessionId, exerciseId, index, target, saved, editable, onDirty, onSaved }: { sessionId: string; exerciseId: string; index: number; target: PlanSet; saved?: SetLog; editable: boolean; onDirty: (dirty: boolean) => void; onSaved: () => void }) {
  const mutation = useCommand();
  const [values, setValues] = useState({ actualReps: saved?.actual_reps ?? null, loadKg: saved?.load_kg ?? null, durationSeconds: saved?.duration_seconds ?? null, distanceM: saved?.distance_m ?? null });
  const [skipped, setSkipped] = useState(saved?.skipped || false), [dirty, setDirty] = useState(false), [notice, setNotice] = useState("");
  function changed() { setDirty(true); setNotice(""); onDirty(true); }
  async function save() {
    setDirty(true); onDirty(true);
    const actual = skipped ? { actualReps: null, loadKg: null, durationSeconds: null, distanceM: null } : values;
    const result = await mutation.run("session.save-set", { sessionId, exerciseId, setIndex: index, revision: saved?.revision || 0, ...actual, skipped });
    if (result) { setDirty(false); onDirty(false); setNotice("Saved to server."); onSaved(); }
  }
  const fields = [
    ["actualReps", "Repetitions", target.reps, 1000], ["loadKg", "Load (kg)", target.loadKg, 1000],
    ["durationSeconds", "Duration (seconds)", target.durationSeconds, 86400], ["distanceM", "Distance (metres)", target.distanceM, 1000000],
  ] as const;
  return <form className="gymaf-set-target" onSubmit={event => { event.preventDefault(); void save(); }}>
    <fieldset className="gymaf-fieldset gymaf-set-log" disabled={!editable || mutation.busy}>
      <legend>Set {index + 1} · rest target {target.restSeconds}s</legend>
      {fields.map(([key,label,planned,max]) => <Field key={key} label={`${label}${planned !== null ? ` · target ${planned}` : ""}`} type="number" min={0} max={max} step={key === "actualReps" ? 1 : "any"} value={values[key] ?? ""} disabled={skipped || !editable || mutation.busy} onChange={event => { setValues(v => ({ ...v, [key]: event.target.value === "" ? null : Number(event.target.value) })); changed(); }} />)}
      <div className="gymaf-between"><label><input type="checkbox" checked={skipped} onChange={event => { setSkipped(event.target.checked); changed(); }} /> Skipped</label>{editable && <button className="button" disabled={mutation.busy || (!dirty && !!saved)}>{mutation.busy ? "Saving…" : "Save set"}</button>}</div>
    </fieldset>
    {dirty && <Note>Unsaved changes. Keep this page open until saving is confirmed.</Note>}<Note>{notice}</Note><ErrorNote message={mutation.error} />
  </form>;
}
export function SessionScreen({ id, back, ownerId }: { id: string; back: string; ownerId:string }) {
  const View=useBackend()?TemplateSession:SessionView;
  const resource = useResource<SessionDetail>(`workout-sessions/${id}`), transition = useCommand();
  const member = useResource<MemberRecord[]>('me/details');
  const savedPreferences=member.data?.find(r=>r.kind==='preferences')?.data;
  const preferences={instructions:String(savedPreferences?.instructions||preferenceDefaults.instructions),tone:String(savedPreferences?.tone||preferenceDefaults.tone),countdown:(savedPreferences?.countdown??preferenceDefaults.countdown)===true,vibration:(savedPreferences?.vibration??preferenceDefaults.vibration)===true};
  const [feedbackDirty,setFeedbackDirty]=useState(false),[exitRequest,setExitRequest]=useState(0),[exitTarget,setExitTarget]=useState(back);
  const router=useRouter();
  const [now, setNow] = useState(0), [dirty, setDirty] = useState<Set<string>>(new Set());
  useEffect(() => {
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, []);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty.size) { event.preventDefault(); event.returnValue = ""; } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty.size]);
  if (!resource.data) return <Pending error={resource.error} reload={resource.reload} />;
  const { session, sets, editable } = resource.data;
  const elapsed = elapsedSeconds(session, now || Date.parse(session.started_at));
  async function change(state: SessionState) {
    if (dirty.size || !resource.data) return;
    const result = await transition.run("session.transition", { sessionId: id, revision: resource.data.session.revision, state });
    if (result) resource.reload();
  }
  const renderSets = (exerciseId: string) => {
    const exercise = session.prescription.exercises.find(item => item.id === exerciseId)!;
    return exercise.sets.map((target,index) => {
      const saved = sets.find(s => s.exercise_id === exercise.id && s.set_index === index), fieldKey = `${exercise.id}:${index}`;
      return <SetEditor key={`${fieldKey}:${saved?.revision || 0}`} sessionId={id} exerciseId={exercise.id} index={index} target={target} saved={saved} editable={editable} onDirty={value => setDirty(previous => { const next = new Set(previous); if (value) next.add(fieldKey); else next.delete(fieldKey); return next; })} onSaved={resource.reload} />;
    });
  };
  if (session.state === 'completed' || session.state === 'abandoned') return <SessionSummary detail={resource.data} back={back} renderSets={renderSets} feedbackDirty={feedbackDirty} onDirtyExit={href=>{setExitTarget(href);setExitRequest(n=>n+1);}} feedback={<SessionFeedbackPanel ownerId={ownerId} exitRequest={exitRequest} onLeave={()=>router.push(exitTarget)} sessionId={id} exercises={session.prescription.exercises} onDirty={setFeedbackDirty}/>}/>;
  return <View renderRecording={(exerciseId,close)=><AttachmentComposer ownerId={ownerId} relationshipId={session.relationship_id} sessionId={id} exerciseId={exerciseId} exerciseName={session.prescription.exercises.find(e=>e.id===exerciseId)?.name} coachName="your coach" recordVideo onClose={close} onShared={()=>{}}/>} renderFlag={(exerciseId,close)=><SessionFlagPanel ownerId={ownerId} sessionId={id} exercise={session.prescription.exercises.find(e=>e.id===exerciseId)!} onClose={close}/>} preferences={preferences} detail={resource.data} elapsed={elapsed} back={back} dirty={!!dirty.size} busy={transition.busy} error={resource.error || transition.error} onTransition={state => void change(state)} renderSets={renderSets} renderHistory={exerciseId=><ExerciseHistoryPanel sessionId={id} exerciseId={exerciseId}/>}/>;
}
