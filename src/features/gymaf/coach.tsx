"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Bootstrap, CheckIn, Program, ProgramVersion, RelationshipDetail, WorkspaceDetail } from "@/shared/gymaf/contracts";
import { localDate } from "@/shared/gymaf/validation";
import { invitationToken } from "./api";
import { Messages } from "./messages";
import { ProfileScreen } from "./profile";
import { ProgramBuilder } from "./program-builder";
import { Empty, ErrorNote, Field, Head, Note, Pending, Row, useCommand, useResource } from "./ui";

function Invitations({ workspaceId }: { workspaceId: string }) {
  const [email,setEmail] = useState(""), [link,setLink] = useState(""); const token = useRef(""); const mutation = useCommand();
  async function invite() { token.current ||= invitationToken(); if (await mutation.run("invitation.create", { workspaceId,email,token:token.current })) setLink(`${window.location.origin}/join#token=${token.current}`); }
  return <section className="gymaf-panel gymaf-stack"><h2>Invite a client</h2><form className="gymaf-stack" onSubmit={event => { event.preventDefault(); void invite(); }}><Field label="Client email" type="email" required maxLength={254} value={email} onChange={event => { setEmail(event.target.value); token.current=""; setLink(""); }} /><button className="button" disabled={mutation.busy || !!link}>Create invitation</button><ErrorNote message={mutation.error} /></form>{link && <><Note>Send this private link to the intended client. It expires in seven days. No email was automatically sent.</Note><code className="gymaf-secret">{link}</code></>}</section>;
}
function Review({ checkIn, reload }: { checkIn: CheckIn; reload: () => void }) {
  const [body,setBody] = useState(""); const mutation = useCommand();
  return <article className="gymaf-panel gymaf-stack"><h3>Week of {checkIn.week_start}</h3><p>Reported difficulty: {checkIn.difficulty}/10</p><p className="gymaf-pre">{checkIn.body}</p>{checkIn.review ? <p className="gymaf-pre">{checkIn.review.body}</p> : <form className="gymaf-stack" onSubmit={async event => { event.preventDefault(); if (await mutation.run("checkin.review", { checkinId:checkIn.id,body })) { setBody(""); reload(); } }}><label className="form-field">Your feedback<textarea required maxLength={4000} value={body} onChange={event => setBody(event.target.value)} /></label><button className="button" disabled={mutation.busy}>Send feedback</button><ErrorNote message={mutation.error} /></form>}</article>;
}
function ClientDetail({ id, account, workspace }: { id: string; account: Bootstrap; workspace: WorkspaceDetail }) {
  const resource = useResource<RelationshipDetail>(`relationships/${id}`), mutation = useCommand();
  const [version,setVersion] = useState(""), [date,setDate] = useState(localDate(account.user.timezone));
  if (!resource.data) return <Pending error={resource.error} reload={resource.reload} />;
  const data = resource.data;
  return <div className="gymaf-stack"><Head title={data.relationship.client_name || "Client"} back="/coach" /><section className="gymaf-panel gymaf-stack"><p>{data.relationship.state} · {data.can_train ? "Service active" : "No active service"}</p><h3>Goals</h3><p className="gymaf-pre">{data.client.goal || "Not provided"}</p><h3>Equipment</h3><p className="gymaf-pre">{data.client.equipment || "Not provided"}</p><h3>Availability</h3><p className="gymaf-pre">{data.client.availability || "Not provided"}</p></section>
    <form className="gymaf-panel gymaf-stack" onSubmit={async event => { event.preventDefault(); if (await mutation.run("program.assign", { versionId:version,relationshipId:id,startDate:date })) resource.reload(); }}><h2>Assign a published program</h2><label className="form-field">Program version<select value={version} required onChange={event => setVersion(event.target.value)}><option value="">Select a published version</option>{workspace.versions.map(v => <option key={v.id} value={v.id}>{v.title} · version {v.version}</option>)}</select></label><Field label="Start date" type="date" required value={date} onChange={event => setDate(event.target.value)} /><button className="button primary" disabled={mutation.busy || !version}>Assign program</button><ErrorNote message={mutation.error} /></form>
    <h2>Training history</h2>{!data.sessions.length && <Empty>No training sessions yet.</Empty>}{data.sessions.map(s => <Row key={s.id} href={`/coach/sessions/${s.id}`} detail={`${new Date(s.started_at).toLocaleDateString()} · ${s.state.replaceAll("_"," ")}`}>{s.prescription.title}</Row>)}
    <h2>Scheduled workouts</h2>{data.workouts.map(w => <article key={w.id} className="gymaf-panel"><h3>{w.prescription.title}</h3><p>{w.scheduled_date} · {w.state}</p></article>)}
    <h2>Check-ins</h2>{!data.check_ins.length && <Empty>No check-ins yet.</Empty>}{data.check_ins.map(c => <Review key={c.id} checkIn={c} reload={resource.reload} />)}
    <Messages key={id} relationshipId={id} userId={account.user.id} canSend={data.can_train} />
    <button className="button" disabled={mutation.busy || data.relationship.state === "ended"} onClick={async () => { if (window.confirm("End this relationship? You will lose access to these coaching records. The client keeps their permitted history.")) { if (await mutation.run("relationship.end", { relationshipId:id })) window.location.assign("/coach"); } }}>End coaching relationship</button>
  </div>;
}
function ProgramEditor({ id }: { id: string }) {
  const resource = useResource<{ program: Program; versions: ProgramVersion[] } | null>(`programs/${id}`), mutation = useCommand();
  if (resource.data === null) return <Empty>Program unavailable.</Empty>;
  if (!resource.data) return <Pending error={resource.error} reload={resource.reload} />;
  const { program,versions } = resource.data;
  return <div className="gymaf-stack"><Head title={program.title} back="/coach/programs" /><ProgramBuilder key={program.revision} workspaceId={program.workspace_id} program={program} onSaved={resource.reload} /><section className="gymaf-panel gymaf-stack"><h2>Published versions</h2><Note>Publish the latest saved draft only. Unsaved edits in the form are not part of a published version.</Note>{versions.map(v => <p key={v.id}>Version {v.version} · {new Date(v.created_at).toLocaleString()}</p>)}<button className="button" disabled={mutation.busy} onClick={async () => { if (window.confirm("Publish the saved draft as an immutable version? Confirm its instructions are suitable for your intended test.")) { if (await mutation.run("program.publish", { programId:id,revision:program.revision })) resource.reload(); } }}>Publish saved draft</button><ErrorNote message={mutation.error} /></section></div>;
}
function WorkspaceProfile({ data, reload }: { data: WorkspaceDetail; reload: () => void }) {
  const [name,setName] = useState(data.workspace.public_name || data.workspace.name), [bio,setBio] = useState(data.workspace.bio), [published,setPublished] = useState(data.workspace.published), mutation = useCommand();
  return <form className="gymaf-panel gymaf-stack" onSubmit={async event => { event.preventDefault(); if (await mutation.run("workspace.publish", { workspaceId:data.workspace.id,publicName:name,bio,published })) reload(); }}><h2>Coach page</h2><Field label="Approved public name" required maxLength={120} value={name} onChange={event => setName(event.target.value)} /><label className="form-field">Biography<textarea maxLength={2000} value={bio} onChange={event => setBio(event.target.value)} /></label><label><input type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)} /> Publish these approved public fields</label><Note>Do not publish another person’s identity or credentials without permission. No price or personal-coaching promise is invented by this page.</Note><button className="button" disabled={mutation.busy}>Save public profile</button>{data.workspace.published && <Link href={`/coaches/${data.workspace.slug}`} className="text-button">View coach page</Link>}<ErrorNote message={mutation.error} /></form>;
}
export function CoachArea({ account, path, workspaceId, reloadAccount }: { account: Bootstrap; path: string[]; workspaceId?: string; reloadAccount: () => void }) {
  const selected = account.workspaces.find(w => w.id === workspaceId) || account.workspaces[0];
  const resource = useResource<WorkspaceDetail>(selected && !account.requires_mfa ? `workspaces/${selected.id}` : null);
  if (account.requires_mfa) return <div className="gymaf-stack"><Head title="Secure your coach account" /><Note>Verify an authenticator before accessing client records.</Note><ProfileScreen key={account.user.revision} account={account} reload={reloadAccount} /></div>;
  if (!selected) return <Empty>No coach workspace is assigned. An operator must create one for your verified account.</Empty>;
  if (!resource.data) return <Pending error={resource.error} reload={resource.reload} />;
  const data = resource.data;
  if (path[0] === "clients" && path[1]) return <ClientDetail key={path[1]} id={path[1]} account={account} workspace={data} />;
  if (path[0] === "profile") return <div className="gymaf-stack"><WorkspaceProfile data={data} reload={resource.reload} /><ProfileScreen key={account.user.revision} account={account} reload={reloadAccount} /></div>;
  if (path[0] === "programs" && path[1] === "new") return <><Head title="Create a program" back="/coach/programs" /><ProgramBuilder workspaceId={selected.id} /></>;
  if (path[0] === "programs" && path[1]) return <ProgramEditor key={path[1]} id={path[1]} />;
  if (path[0] === "programs") return <div className="gymaf-stack"><Head title="Programs" /><Link className="button primary" href={`/coach/programs/new?workspace=${selected.id}`}>Create program</Link>{!data.programs.length && <Empty>Create your first program, then publish and assign it.</Empty>}{data.programs.map(p => <Row key={p.id} href={`/coach/programs/${p.id}?workspace=${selected.id}`} detail={`Draft revision ${p.revision} · ${data.versions.filter(v => v.program_id === p.id).length} published versions`}>{p.title}</Row>)}</div>;
  if (path[0] === "reviews") { const pending = data.check_ins.filter(c => !c.review); return <div className="gymaf-stack"><Head title="Review inbox" />{!pending.length && <Empty>No unreviewed check-ins.</Empty>}{pending.map(c => <Row key={c.id} href={`/coach/clients/${c.relationship_id}`} detail={`Week of ${c.week_start}`}>{data.clients.find(r => r.id === c.relationship_id)?.client_name || "Client check-in"}</Row>)}</div>; }
  if (path.length) return <Empty>This coach page is not available.</Empty>;
  return <div className="gymaf-stack"><Head title={account.user.locale === "bg" ? "Твоите клиенти" : "Your clients"} />{account.workspaces.length > 1 && <label className="form-field">Workspace<select value={selected.id} onChange={event => window.location.assign(`/coach?workspace=${event.target.value}`)}>{account.workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}<div className="home-grid"><div className="today-column gymaf-stack">{!data.clients.length && <Empty>No clients yet. Create an invitation to connect one.</Empty>}{data.clients.map(r => <Row key={r.id} href={`/coach/clients/${r.id}?workspace=${selected.id}`} detail={r.state}>{r.client_name || "Client"}</Row>)}</div><div className="week-column gymaf-stack"><Invitations workspaceId={selected.id} /><Row href="/coach/reviews" detail={`${data.check_ins.filter(c => !c.review).length} loaded check-ins awaiting review`}>Review inbox</Row></div></div></div>;
}
