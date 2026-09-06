"use client";
import Link from "next/link";
import { MemberMediaArea, ProfileWithPhotos } from "./member-media";
import { MemberArea } from "./member-area";
import { TrainingLibrary } from "./training-library";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientHome, WorkoutDetailView, ScheduleView, ProgressView } from "./client-views";
import type { Bootstrap, RelationshipDetail, ScheduledWorkout } from "@/shared/gymaf/contracts";
import { localDate, monday } from "@/shared/gymaf/validation";
import { Messages } from "./messages";
import { ProfileScreen } from "./profile";
import { CoachRatingDialog } from "./coach-rating";
import { CoachDirectory } from "./coach-directory";
import { Appointments } from "./appointments";
import { Membership,GuestPasses } from './billing';
import { Friends } from "./friends";
import { SharedMedia } from './conversation-media';
import { WorkoutActivity, LaunchScreen } from './workout-activity';
import { ShippingEditor } from "./shipping-editor";
import { AccountEditor } from "./account-editor";
import { ProfileEditor } from "./profile-editor";
import { Empty, ErrorNote, Field, Head, Note, Pending, Row, useCommand, useResource } from "./ui";

function WorkoutDetail({ workout, data, query }: { workout: ScheduledWorkout; data: RelationshipDetail; query: string }) {
  const mutation = useCommand(), router = useRouter();
  const openSession = data.sessions.find(s => s.scheduled_workout_id === workout.id && (s.state === "in_progress" || s.state === "paused"));
  async function start() { const result = await mutation.run("session.start", { scheduledId: workout.id }); if (result) router.push(`/app/sessions/${result.id}${query}`); }
  return <WorkoutDetailView workout={workout} query={query}>
    <ErrorNote message={mutation.error}/>{openSession ? <Link href={`/app/sessions/${openSession.id}${query}`} className="button primary full">Resume</Link> : <button className="button primary full" disabled={mutation.busy || !data.can_train || workout.state === "canceled"} onClick={() => void start()}>{mutation.busy ? "Starting…" : workout.state === "completed" ? "Start New Attempt" : "Start"}</button>}
    {!data.can_train && <Note>Contact your coach to reactivate training. Your saved history remains available.</Note>}
  </WorkoutDetailView>;
}
function Schedule({data,query,reload}:{data:RelationshipDetail;query:string;reload:()=>void}) {
 const mutation=useCommand();
 return <ScheduleView data={data} query={query} busy={mutation.busy} error={mutation.error} onMove={async(w,date)=>{if(await mutation.run("schedule.move",{scheduledId:w.id,date,revision:w.revision})){reload();return true;}return false;}}/>;
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
  const goalMutation=useCommand();
  const selected = account.relationships.find(r => r.id === selectedId) || account.relationships.find(r => r.state === "active" || r.state === "paused") || account.relationships[0];
  const resource = useResource<RelationshipDetail>(selected ? `relationships/${selected.id}` : null);
  const query = selected ? `?relationship=${selected.id}` : "";
  const reload = () => { resource.reload(); reloadAccount(); };
  if(path[0]==='checkout'||(path[0]==='account'&&path[1]==='plan'))return <Membership key={account.user.id+path.join('/')} relationshipId={selected?.id} checkoutView={path[0]==='checkout'}/>;
  if(path[0]==='friends'&&path[1]==='invite')return <GuestPasses key={account.user.id}/>;
  if(path[0]==='friends')return <Friends key={account.user.id} ownerId={account.user.id} inviteView={path[1]==='invite'} query={query}/>;
  if(path[0]==='appointments')return <Appointments workspaceId={path[1]} zone={account.user.timezone} query={query}/>;
  if(path[0]==='onboarding'&&['coach','matching'].includes(path[1]))return <CoachDirectory account={account} path={path[1]==='coach'?['coaches','intro']:['coaches','matching']} query={query}/>;
  if(path[0]==='coaches')return <CoachDirectory account={account} path={path} query={query}/>;
  if(path[0]==='account'&&path[1]==='shipping')return <ShippingEditor ownerId={account.user.id} query={query}/>;
  if(path[0]==='account')return <AccountEditor key={account.user.id} user={account.user} query={query}/>;
  if(path[0]==='profile'&&path[1]==='edit')return <ProfileEditor key={account.user.id} user={account.user} query={query} reload={reloadAccount}/>;
  if ((path[0] === "progress" && path[1] === "photos") || (path[0] === "profile" && ["avatar","cover"].includes(path[1]))) return <MemberMediaArea key={`${account.user.id}:${path[1]}`} account={account} kind={path[1] === "avatar" ? "avatar" : path[1] === "cover" ? "cover" : "progress"} query={query}/>;
  if ((path[0] === "settings" && !["security","service","support"].includes(path[1])) || path[0] === "progress" || (path[0] === "profile" && path[1] === "event")) return <MemberArea account={account} path={path} query={query}/>;
  if (path[0] === "settings" || (path[0] === "profile" && path[1] === "edit")) return selected && !resource.data ? <Pending error={resource.error} reload={resource.reload}/> : <ProfileScreen key={`${account.user.revision}:${path.join('/')}`} account={account} relationship={resource.data} reload={reload} query={query} mode={path[0] === 'profile' ? 'edit' : path[1] === 'security' || path[1] === 'service' || path[1] === 'support' ? path[1] : 'settings'} />;
  if (path[0] === "profile" && selected && !resource.data) return <Pending error={resource.error} reload={resource.reload}/>;
  if (path[0] === "profile") return <ProfileWithPhotos account={account} data={resource.data} query={query}/>;
  if(path[0]==='system'&&path[1]==='launch')return <LaunchScreen query={query}/>;
  if (!selected) return <div className="gymaf-stack"><Head title={`Welcome${account.user.display_name ? ", " + account.user.display_name : ""}`} /><Empty>No coach is connected to this account yet. Open the invitation link your coach gave you.</Empty><Row href="/app/profile">Complete your profile</Row><Row href="/app/coaches">Explore Coaches</Row>{account.workspaces.length > 0 && <Row href="/coach">Open coach workspace</Row>}</div>;
  if (!resource.data) return <Pending error={resource.error} reload={resource.reload} />;
  const data = resource.data;
  if(path[0]==='system'&&['launch','live-activity','dynamic-island','widgets'].includes(path[1]))return <WorkoutActivity data={data} mode={path[1]} query={query}/>;
  if(path[0]==='messages'&&['videos','shared'].includes(path[1]))return <SharedMedia canSend={data.can_train} relationshipId={selected.id} query={query} videosOnly={path[1]==='videos'}/>;
  if (path[0] === "workouts" && (!path[1] || path[1] === "picks")) return <TrainingLibrary key={selected.id} data={data} query={query}/>;
  if (path[0] === "workouts" && path[1]) { const workout = data.workouts.find(w => w.id === path[1]); return workout ? <WorkoutDetail key={workout.id} workout={workout} data={data} query={query} /> : <Empty>This workout is not in the currently loaded schedule. Open it through your current schedule or session history.</Empty>; }
  if (path[0] === "schedule") return <Schedule data={data} query={query} reload={resource.reload} />;
  if (path[0] === "messages") return <><Messages initialComposer={path[1]==="photo"} presentation="client" coachName={data.relationship.coach_name} key={selected.id} relationshipId={selected.id} userId={account.user.id} canSend={data.can_train} />{path[1]==='rate'&&<CoachRatingDialog ownerId={account.user.id} relationshipId={selected.id} coachName={data.relationship.coach_name}/>}</>;
  if (path[0] === "check-ins") return <CheckIns key={selected.id} data={data} reload={resource.reload} />;
  if (path[0] === "history") return <ProgressView data={data} query={query} user={account.user} busy={goalMutation.busy} error={goalMutation.error} onGoal={async goal=>{
    const u=account.user;
    if(await goalMutation.run("profile.save",{displayName:u.display_name,locale:u.locale,timezone:u.timezone,goal,equipment:u.equipment,availability:u.availability,revision:u.revision})){reload();return true;}return false;
  }}/>;
  if (path.length) return <Empty>This page is not available.</Empty>;
  return <ClientHome account={account} data={data} query={query}/>;
}
