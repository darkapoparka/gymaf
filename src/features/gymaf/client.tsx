"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell } from "lucide-react";
import type { Bootstrap, RelationshipDetail, ScheduledWorkout } from "@/shared/gymaf/contracts";
import { localDate, monday } from "@/shared/gymaf/validation";
import { Messages } from "./messages";
import { ProfileScreen } from "./profile";
import { Empty, ErrorNote, Field, Head, Note, Pending, Row, useCommand, useResource } from "./ui";

function WorkoutCard({ workout, query = "" }: { workout: ScheduledWorkout; query?: string }) {
  return <article className="today-card"><Link className="gymaf-workout-art" href={`/app/workouts/${workout.id}${query}`} aria-label={workout.prescription.title}><Dumbbell aria-hidden="true" /></Link><Link className="today-copy" href={`/app/workouts/${workout.id}${query}`}><h3>{workout.prescription.title}</h3><p>{workout.scheduled_date} · {workout.prescription.exercises.length} exercises · {workout.state}</p></Link></article>;
}
function WorkoutDetail({ workout, data, query }: { workout: ScheduledWorkout; data: RelationshipDetail; query: string }) {
  const mutation = useCommand(), router = useRouter();
  const openSession = data.sessions.find(s => s.scheduled_workout_id === workout.id && (s.state === "in_progress" || s.state === "paused"));
  async function start() { const result = await mutation.run("session.start", { scheduledId: workout.id }); if (result) router.push(`/app/sessions/${result.id}`); }
  return <div className="gymaf-stack"><Head title={workout.prescription.title} back={`/app${query}`} /><WorkoutCard workout={workout} query={query} />
    {workout.prescription.exercises.map(exercise => <section className="gymaf-panel gymaf-stack" key={exercise.id}><h2>{exercise.name}</h2><p className="gymaf-pre">{exercise.instructions}</p>{exercise.sets.map((set,index) => <p key={index}>Set {index + 1}: {[set.reps !== null ? `${set.reps} reps` : "",set.loadKg !== null ? `${set.loadKg} kg` : "",set.durationSeconds ? `${set.durationSeconds}s` : "",set.distanceM ? `${set.distanceM}m` : "",`${set.restSeconds}s rest`].filter(Boolean).join(" · ")}</p>)}</section>)}
    <ErrorNote message={mutation.error} />{openSession ? <Link href={`/app/sessions/${openSession.id}`} className="button primary full">Resume saved session</Link> : <button className="button primary full" disabled={mutation.busy || !data.can_train || workout.state === "canceled"} onClick={() => void start()}>{mutation.busy ? "Starting…" : workout.state === "completed" ? "Start a new attempt" : "Start workout"}</button>}
    {!data.can_train && <Note>An active coaching service is needed to start another workout. Your existing history remains available.</Note>}
  </div>;
}
function Schedule({ data, query, reload }: { data: RelationshipDetail; query: string; reload: () => void }) {
  const mutation = useCommand(), [editing,setEditing] = useState(""), [date,setDate] = useState("");
  return <div className="gymaf-stack"><Head title="Training schedule" back={`/app${query}`} /><ErrorNote message={mutation.error} />{!data.workouts.length && <Empty>Your coach has not assigned training yet.</Empty>}{[...data.workouts].sort((a,b) => a.scheduled_date.localeCompare(b.scheduled_date)).map(workout => <section key={workout.id} className="gymaf-panel gymaf-stack"><Row href={`/app/workouts/${workout.id}${query}`} detail={`${workout.scheduled_date} · ${workout.state}`}>{workout.prescription.title}</Row>{editing === workout.id ? <form className="gymaf-stack" onSubmit={async event => { event.preventDefault(); if (await mutation.run("schedule.move", { scheduledId:workout.id,date,revision:workout.revision })) { setEditing(""); reload(); } }}><Field label="New date" type="date" required value={date} onChange={event => setDate(event.target.value)} /><button className="button" disabled={mutation.busy}>Save date</button></form> : workout.state === "assigned" && data.can_train && <button className="text-button" onClick={() => { setEditing(workout.id); setDate(workout.scheduled_date); }}>Move workout</button>}</section>)}</div>;
}
export function CheckIns({ data, reload }: { data: RelationshipDetail; reload: () => void }) {
  const mutation = useCommand();
  const [weekStart,setWeekStart] = useState(monday(localDate(data.client.timezone))), [difficulty,setDifficulty] = useState(5), [body,setBody] = useState("");
  const submitted = data.check_ins.some(c => c.week_start === weekStart);
  return <div className="gymaf-stack"><Head title="Weekly check-in" /><form className="gymaf-panel gymaf-stack" onSubmit={async event => { event.preventDefault(); if (await mutation.run("checkin.submit", { relationshipId:data.relationship.id,weekStart,difficulty,body })) { setBody(""); reload(); } }}>
    <Field label="Week beginning (Monday)" type="date" required value={weekStart} onChange={event => setWeekStart(event.target.value)} /><Field label="Training difficulty (1–10)" type="number" min={1} max={10} required value={difficulty} onChange={event => setDifficulty(Number(event.target.value))} />
    <label className="form-field">How did training go?<textarea value={body} maxLength={2000} onChange={event => setBody(event.target.value)} /></label><button className="button primary" disabled={mutation.busy || !data.can_train || submitted}>{submitted ? "Submitted for this week" : "Send check-in"}</button><ErrorNote message={mutation.error} />
  </form>{data.check_ins.map(c => <article key={c.id} className="gymaf-panel gymaf-stack"><h2>Week of {c.week_start}</h2><p>Difficulty: {c.difficulty}/10</p><p className="gymaf-pre">{c.body}</p>{c.review ? <><h3>Your coach’s feedback</h3><p className="gymaf-pre">{c.review.body}</p><small>{new Date(c.review.created_at).toLocaleString()}</small></> : <Note>Awaiting your coach’s review.</Note>}</article>)}</div>;
}
export function ClientArea({ account, path, selectedId, reloadAccount }: { account: Bootstrap; path: string[]; selectedId?: string; reloadAccount: () => void }) {
  const selected = account.relationships.find(r => r.id === selectedId) || account.relationships.find(r => r.state === "active" || r.state === "paused") || account.relationships[0];
  const resource = useResource<RelationshipDetail>(selected ? `relationships/${selected.id}` : null);
  const query = selected ? `?relationship=${selected.id}` : "";
  const reload = () => { resource.reload(); reloadAccount(); };
  if (path[0] === "profile") return <ProfileScreen key={account.user.revision} account={account} relationship={resource.data} reload={reload} />;
  if (!selected) return <div className="gymaf-stack"><Head title={`Welcome${account.user.display_name ? ", " + account.user.display_name : ""}`} /><Empty>No coach is connected to this account yet. Open the invitation link your coach gave you.</Empty><Row href="/app/profile">Complete your profile</Row>{account.workspaces.length > 0 && <Row href="/coach">Open coach workspace</Row>}</div>;
  if (!resource.data) return <Pending error={resource.error} reload={resource.reload} />;
  const data = resource.data, locale = account.user.locale, today = localDate(account.user.timezone);
  if (path[0] === "workouts" && path[1]) { const workout = data.workouts.find(w => w.id === path[1]); return workout ? <WorkoutDetail key={workout.id} workout={workout} data={data} query={query} /> : <Empty>This workout is not in the currently loaded schedule. Open it through your current schedule or session history.</Empty>; }
  if (path[0] === "schedule") return <Schedule data={data} query={query} reload={resource.reload} />;
  if (path[0] === "messages") return <><Head title={data.relationship.coach_name || "Your coach"} /><Messages key={selected.id} relationshipId={selected.id} userId={account.user.id} canSend={data.can_train} /></>;
  if (path[0] === "check-ins") return <CheckIns key={selected.id} data={data} reload={resource.reload} />;
  if (path[0] === "history") { const completed = data.sessions.filter(s => s.state === "completed"); return <div className="gymaf-stack"><Head title={locale === "bg" ? "Твоят прогрес" : "Your progress"} /><div className="gymaf-stats"><article className="gymaf-panel"><p className="gymaf-stat">{completed.length}</p><p>Completed attempts</p></article><article className="gymaf-panel"><p className="gymaf-stat">{Math.round(completed.reduce((n,s) => n+s.elapsed_seconds,0)/60)}</p><p>Recorded minutes</p></article></div><Note>Showing the latest {data.sessions.length} loaded sessions. Totals describe these records, not a claimed lifetime total.</Note>{!data.sessions.length && <Empty>Completed training will appear here.</Empty>}<div className="gymaf-row-list">{data.sessions.map(s => <Row key={s.id} href={`/app/sessions/${s.id}`} detail={`${new Date(s.started_at).toLocaleString()} · ${s.state.replaceAll("_"," ")}`}>{s.prescription.title}</Row>)}</div></div>; }
  if (path.length) return <Empty>This page is not available.</Empty>;
  const upcoming = [...data.workouts].filter(w => w.state === "assigned").sort((a,b) => a.scheduled_date.localeCompare(b.scheduled_date)), next = upcoming.find(w => w.scheduled_date >= today) || upcoming[0];
  return <div className="gymaf-stack"><Head title={`${locale === "bg" ? "Здравей" : "Hello"}, ${account.user.display_name || (locale === "bg" ? "приятелю" : "there")}`} />
    {account.relationships.length > 1 && <label className="form-field">Coaching relationship<select value={selected.id} onChange={event => { window.location.assign(`/app?relationship=${event.target.value}`); }}>{account.relationships.map(r => <option key={r.id} value={r.id}>{r.coach_name || "Coach"} · {r.state}</option>)}</select></label>}
    <div className="home-grid"><div className="today-column gymaf-stack"><h2>{locale === "bg" ? "Твоята тренировка" : "Your training"}</h2>{next ? <WorkoutCard workout={next} query={query} /> : <Empty>Your coach is preparing your next training. You can still review your history and feedback.</Empty>}<Row href={`/app/check-ins${query}`}>Your weekly check-in</Row></div>
      <div className="week-column gymaf-stack"><section className="gymaf-panel gymaf-stack"><h2>{data.relationship.coach_name || "Your coach"}</h2><p>{data.can_train ? "Your coaching service is active." : "No active service entitlement. Contact your coach or use account support."}</p><Link className="button" href={`/app/messages${query}`}>Open messages</Link></section><section className="this-week gymaf-stack"><h2>Coming up</h2>{upcoming.slice(0,5).map(w => <Row key={w.id} href={`/app/workouts/${w.id}${query}`} detail={w.scheduled_date}>{w.prescription.title}</Row>)}<div className="button-row"><Link className="button" href={`/app/schedule${query}`}>Schedule</Link><Link className="button" href={`/app/history${query}`}>History</Link></div></section></div></div>
  </div>;
}
