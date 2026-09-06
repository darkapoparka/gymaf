"use client";
import Link, { useAppRouter as useRouter } from '../capture-link';
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useBackend } from "@/lib/backend/context";
import { api, command } from "@/lib/backend/api";
import { SessionScreen } from "@/features/gymaf/session";
import { localDate, monday } from "@/shared/gymaf/validation";
import type { Workout } from "@/lib/data";
import { PageHead, Row, Sheet } from "@/components/primitives";

export function ConnectedHistory() {
  const backend = useBackend()!;
  return <><PageHead title="Workout History" back="/" /><div className="row-group">
    {!backend.relationship?.sessions.length && <p className="note">Your saved workout attempts will appear here.</p>}
    {backend.relationship?.sessions.map(s => <Row key={s.id} href={`/workouts/${s.scheduled_workout_id}/summary?attempt=${s.id}`} icon={<CalendarDays />} detail={`${new Date(s.started_at).toLocaleString()} · ${s.state} · ${Math.floor(s.elapsed_seconds / 60)} min`}>{s.prescription.title}</Row>)}
  </div></>;
}

export function ConnectedSchedule() {
  const backend = useBackend()!, [editing, setEditing] = useState(""), [date, setDate] = useState("");
  return <><PageHead title="Edit Schedule" back="/" /><div className="schedule">
    {!backend.relationship?.workouts.length && <p className="note">No training has been assigned yet.</p>}
    {[...(backend.relationship?.workouts || [])].sort((a,b) => a.scheduled_date.localeCompare(b.scheduled_date)).map(w => <div className="schedule-day" key={w.id}><div><b>{new Date(w.scheduled_date + "T12:00:00").toLocaleDateString("en", { weekday: "short" })}</b><span>{w.scheduled_date.slice(8)}</span></div><div><Link href={`/workouts/${w.id}`}>{w.prescription.title}</Link><small>{w.scheduled_date} · {w.state}</small><div className="schedule-actions"><button disabled={backend.busy || !backend.relationship?.can_train || w.state !== "assigned"} onClick={() => { setEditing(w.id); setDate(w.scheduled_date); }}>Move workout</button></div></div></div>)}
  </div>{editing && <Sheet title="Move workout" onClose={() => setEditing("")}><form onSubmit={async event => { event.preventDefault(); const w = backend.relationship?.workouts.find(w => w.id === editing); if (!w) return; try { await backend.run("schedule.move", { scheduledId: w.id, date, revision: w.revision }); setEditing(""); } catch {} }}><label className="form-field">Date<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label><button className="button primary full" disabled={backend.busy}>Save date</button></form></Sheet>}</>;
}

export function ConnectedCheckIns() {
  const backend = useBackend()!, relationship = backend.relationship;
  const [week, setWeek] = useState(monday(localDate(backend.account.user.timezone))), [difficulty, setDifficulty] = useState("5"), [body, setBody] = useState("");
  return <><PageHead title="Weekly check-in" back="/" />{!relationship ? <p className="note">Connect with your coach before submitting a check-in.</p> : <>
    <form onSubmit={async event => { event.preventDefault(); try { await backend.run("checkin.submit", { relationshipId: relationship.relationship.id, weekStart: week, difficulty: Number(difficulty), body }); setBody(""); } catch {} }}>
      <label className="form-field">Week beginning<input type="date" required value={week} onChange={e => setWeek(e.target.value)} /></label>
      <label className="form-field">Training difficulty (1–10)<input type="number" min={1} max={10} required value={difficulty} onChange={e => setDifficulty(e.target.value)} /></label>
      <label className="form-field">How did training go?<textarea value={body} maxLength={2000} onChange={e => setBody(e.target.value)} /></label>
      <button className="button primary full" disabled={backend.busy || !relationship.can_train || relationship.check_ins.some(c => c.week_start === week)}>{relationship.check_ins.some(c => c.week_start === week) ? "Submitted for this week" : "Send check-in"}</button>
    </form><div className="row-group">{relationship.check_ins.map(c => <article className="row" key={c.id}><div className="row-copy"><h2>{c.week_start}</h2><p>{c.body}</p><small>Difficulty: {c.difficulty}/10</small><p>{c.review?.body || "Awaiting your coach’s review."}</p></div></article>)}</div>
  </>}</>;
}

export function ConnectedSummary({ workout }: { workout: Workout }) {
  const backend=useBackend()!, query=useSearchParams(), id=query.get("attempt");
  const session=backend.relationship?.sessions.find(s => id ? s.id===id && s.scheduled_workout_id===workout.id : s.scheduled_workout_id===workout.id);
  return session ? <div className="gymaf-connected gymaf-client template-service"><SessionScreen ownerId={backend.account.user.id} id={session.id} back="/history"/></div> : <><PageHead title="Workout Summary" back="/history"/><p className="note">No saved attempt yet.</p></>;
}

export function ConnectedAccount() {
  const backend = useBackend()!, router = useRouter(), [notice, setNotice] = useState("");
  return <><PageHead title="Your Account" back="/settings" /><div className="row-group"><Row href="/profile/edit">Edit Profile</Row><Row href="/check-ins">Weekly check-in</Row><Row href="/security">Account security</Row>{backend.account.workspaces.length>0 && <Row href="/coach">Coach workspace</Row>}{backend.account.operator && <Row href="/operator">Operator tools</Row>}<Row detail={backend.relationship?.can_train ? "Active" : "No active coaching service"}>Coaching service</Row></div><p className="note" role="status">{notice}</p><button className="button full" onClick={async () => { try { const response = await fetch("/api/v1/me/export"); if(!response.ok) throw new Error("Export unavailable"); const blob = await response.blob(), url=URL.createObjectURL(blob), a=document.createElement("a"); a.href=url; a.download="gymaf-export.json"; a.click(); URL.revokeObjectURL(url); } catch(e) { setNotice(e instanceof Error ? e.message : "Export failed"); } }}>Export my data</button><button className="button full" onClick={async () => { try { await api("auth/logout", { method: "POST", body: {} }); await backend.reload(); router.replace("/login"); } catch(e) { setNotice(e instanceof Error ? e.message : "Sign-out failed"); } }}>Sign out</button></>;
}

export function ConnectedSession({ workout }: { workout: Workout }) {
  const backend=useBackend()!;
  const [sessionId,setSessionId]=useState(() => backend.relationship?.sessions.find(s => s.scheduled_workout_id===workout.id && ['in_progress','paused'].includes(s.state))?.id);
  const [commandId]=useState(() => crypto.randomUUID());
  const [error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  useEffect(() => {
    if(sessionId)return;
    let alive=true;
    void command('session.start',{scheduledId:workout.id},commandId).then(result => {if(alive)setSessionId(result.id);}).catch(failure => {if(alive)setError(failure instanceof Error?failure.message:'Could not open your workout.');});
    return () => {alive=false;};
  },[sessionId,workout.id,commandId,attempt]);
  return sessionId ? <div className="gymaf-connected gymaf-client template-service"><SessionScreen ownerId={backend.account.user.id} id={sessionId} back={`/workouts/${workout.id}`}/></div> : <><PageHead title={workout.title} back={`/workouts/${workout.id}`}/><p className="note" role={error?'alert':'status'}>{error||'Opening your workout…'}</p>{error&&<button className="button" onClick={() => {setError('');setAttempt(n=>n+1);}}>Retry</button>}</>;
}
