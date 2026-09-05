"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Program, ProgramPlan, PlanSet, PlanExercise, PlanWorkout } from "@/shared/gymaf/contracts";
import { ErrorNote, Field, Note, useCommand } from "./ui";

const newSet = (): PlanSet => ({ reps: 10, loadKg: null, durationSeconds: null, distanceM: null, restSeconds: 60 });
const newExercise = (): PlanExercise => ({ id: crypto.randomUUID(), name: "", instructions: "", sets: [newSet()] });
const newWorkout = (offset: number): PlanWorkout => ({ id: crypto.randomUUID(), title: "", dayOffset: offset, exercises: [newExercise()] });
export function ProgramBuilder({ workspaceId, program, onSaved }: { workspaceId: string; program?: Program; onSaved?: () => void }) {
  const router = useRouter(), mutation = useCommand();
  const [title, setTitle] = useState(program?.title || ""), [plan, setPlan] = useState<ProgramPlan>(program?.draft || { workouts: [] });
  const [notice, setNotice] = useState("");
  const changeWorkout = (id: string, change: (w: PlanWorkout) => PlanWorkout) => setPlan(previous => ({ workouts: previous.workouts.map(w => w.id === id ? change(w) : w) }));
  function changeExercise(wid: string, eid: string, change: (e: PlanExercise) => PlanExercise) { changeWorkout(wid, w => ({ ...w, exercises: w.exercises.map(e => e.id === eid ? change(e) : e) })); }
  function changeSet(wid: string, eid: string, index: number, change: Partial<PlanSet>) { changeExercise(wid, eid, e => ({ ...e, sets: e.sets.map((s, i) => i === index ? { ...s, ...change } : s) })); }
  async function save() {
    setNotice("");
    const result = await mutation.run(program ? "program.save" : "program.create", program ? { programId: program.id, title, plan, revision: program.revision } : { workspaceId, title, plan });
    if (result) { if (program) { setNotice("Draft saved. Publishing is a separate action."); onSaved?.(); } else router.push(`/coach/programs/${result.id}`); }
  }
  return <form className="gymaf-stack" onSubmit={event => { event.preventDefault(); void save(); }}>
    <fieldset disabled={mutation.busy} className="gymaf-stack gymaf-fieldset"><Field label="Program title" required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} />
      <Note>Drafts are editable. Published versions and previously assigned training stay unchanged. Enter coach-reviewed instructions; no generated prescription is inserted automatically.</Note>
      {plan.workouts.map((w, wi) => <section key={w.id} className="gymaf-panel gymaf-stack"><div className="gymaf-between"><h2>Workout {wi + 1}</h2><button type="button" className="text-button" onClick={() => setPlan(p => ({ workouts: p.workouts.filter(item => item.id !== w.id) }))}>Remove workout</button></div>
        <Field label="Workout title" required maxLength={120} value={w.title} onChange={event => changeWorkout(w.id, current => ({ ...current, title: event.target.value }))} />
        <Field label="Days after program start (0 = first day)" type="number" min={0} max={365} required value={w.dayOffset} onChange={event => changeWorkout(w.id, current => ({ ...current, dayOffset: Number(event.target.value) }))} />
        {w.exercises.map((e, ei) => <article key={e.id} className="gymaf-exercise gymaf-stack"><div className="gymaf-between"><h3>Exercise {ei + 1}</h3><div className="button-row"><button type="button" className="button" disabled={ei === 0} onClick={() => changeWorkout(w.id, current => { const list = [...current.exercises]; [list[ei - 1], list[ei]] = [list[ei], list[ei - 1]]; return { ...current, exercises: list }; })}>Move up</button><button type="button" className="button" onClick={() => changeWorkout(w.id, current => ({ ...current, exercises: current.exercises.filter(item => item.id !== e.id) }))}>Remove</button></div></div>
          <Field label="Exercise name" required maxLength={120} value={e.name} onChange={event => changeExercise(w.id, e.id, current => ({ ...current, name: event.target.value }))} />
          <label className="form-field">Client instructions<textarea maxLength={2000} value={e.instructions} onChange={event => changeExercise(w.id, e.id, current => ({ ...current, instructions: event.target.value }))} /></label>
          {e.sets.map((s, si) => <fieldset key={si} className="gymaf-set-target"><legend>Set {si + 1}</legend><div className="gymaf-target-grid">
            {([['reps', 'Reps', 1000], ['loadKg', 'Load (kg)', 1000], ['durationSeconds', 'Duration (seconds)', 86400], ['distanceM', 'Distance (metres)', 1000000]] as const).map(([key,label,max]) => <Field key={key} label={label} type="number" min={key === 'reps' ? 1 : 0} max={max} step={key === 'reps' ? 1 : 'any'} value={s[key] ?? ""} onChange={event => changeSet(w.id, e.id, si, { [key]: event.target.value === "" ? null : Number(event.target.value) })} />)}
            <Field label="Rest (seconds)" type="number" min={0} max={3600} required value={s.restSeconds} onChange={event => changeSet(w.id, e.id, si, { restSeconds: Number(event.target.value) })} />
          </div><button type="button" className="text-button" onClick={() => changeExercise(w.id, e.id, current => ({ ...current, sets: current.sets.filter((_,i) => i !== si) }))}>Remove set</button></fieldset>)}
          <button type="button" className="button" disabled={e.sets.length >= 20} onClick={() => changeExercise(w.id, e.id, current => ({ ...current, sets: [...current.sets, newSet()] }))}>Add set</button>
        </article>)}
        <button type="button" className="button" disabled={w.exercises.length >= 30} onClick={() => changeWorkout(w.id, current => ({ ...current, exercises: [...current.exercises, newExercise()] }))}>Add exercise</button>
      </section>)}
      <button type="button" className="button" disabled={plan.workouts.length >= 56} onClick={() => setPlan(p => ({ workouts: [...p.workouts, newWorkout(p.workouts.length * 2)] }))}>Add workout</button>
      <ErrorNote message={mutation.error} /><Note>{notice}</Note><button className="button primary full" disabled={!plan.workouts.length}>{mutation.busy ? "Saving…" : "Save draft"}</button>
    </fieldset>
  </form>;
}
