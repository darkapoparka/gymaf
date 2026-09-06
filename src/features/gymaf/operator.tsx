"use client";
import { BillingSetup } from './billing';
import { useState } from "react";
import type { DataRequest, OperatorData } from "@/shared/gymaf/contracts";
import { Empty, ErrorNote, Field, Head, Note, Pending, useCommand, useResource } from "./ui";

function RequestReview({ request, reload }: { request: DataRequest; reload: () => void }) {
  const [resolution,setResolution] = useState(request.resolution), mutation = useCommand();
  async function resolve(state: "acknowledged" | "closed") { if (await mutation.run("request.resolve", { requestId:request.id,state,resolution })) reload(); }
  return <article className="gymaf-panel gymaf-stack"><h3>{request.kind} · {request.state}</h3><small>User: {request.user_id}</small><p className="gymaf-pre">{request.body}</p><label className="form-field">Operator response<textarea value={resolution} maxLength={2000} onChange={event => setResolution(event.target.value)} /></label><div className="button-row"><button className="button" disabled={mutation.busy || !resolution.trim()} onClick={() => void resolve("acknowledged")}>Acknowledge</button>{request.kind !== "deletion" && <button className="button" disabled={mutation.busy || !resolution.trim()} onClick={() => void resolve("closed")}>Close request</button>}</div>{request.kind === "deletion" && <Note>Automated erasure is not implemented. Do not claim this account was deleted. Follow the approved deletion runbook before fulfillment.</Note>}<ErrorNote message={mutation.error} /></article>;
}
export function OperatorArea() {
  const resource = useResource<OperatorData>("operator"), mutation = useCommand();
  const [name,setName] = useState(""), [slug,setSlug] = useState(""), [coachUserId,setCoachUserId] = useState("");
  const [relationshipId,setRelationshipId] = useState(""), [days,setDays] = useState(30), [reason,setReason] = useState("");
  if (!resource.data) return <Pending error={resource.error} reload={resource.reload} />;
  const data = resource.data;
  async function create() { if (await mutation.run("workspace.create", { name,slug,coachUserId })) { setName(""); setSlug(""); setCoachUserId(""); resource.reload(); } }
  async function grant() { const start = new Date(), end = new Date(start.getTime()+days*86400000); if (await mutation.run("entitlement.grant", { relationshipId,startsAt:start.toISOString(),endsAt:end.toISOString(),source:"complimentary",reason })) { setReason(""); resource.reload(); } }
  return <div className="gymaf-stack"><Head title="Operator workspace" /><Note>These controls manage access and support. They are not a global client-health-data browser. No payments are collected.</Note><ErrorNote message={mutation.error} />
    <div className="home-grid"><form className="gymaf-panel gymaf-stack" onSubmit={event => { event.preventDefault(); void create(); }}><h2>Create coach workspace</h2><Field label="Workspace name" value={name} required maxLength={120} onChange={event => setName(event.target.value)} /><Field label="URL slug" value={slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={80} onChange={event => setSlug(event.target.value)} /><Field label="Verified coach account ID" value={coachUserId} required onChange={event => setCoachUserId(event.target.value)} /><Note>The coach must sign in once and give you the account ID shown in their profile.</Note><button className="button" disabled={mutation.busy}>Create workspace</button></form>
      <form className="gymaf-panel gymaf-stack" onSubmit={event => { event.preventDefault(); void grant(); }}><h2>Complimentary test access</h2><label className="form-field">Relationship<select required value={relationshipId} onChange={event => setRelationshipId(event.target.value)}><option value="">Choose a relationship</option>{data.relationships.filter(r => r.state === "active").map(r => <option key={r.id} value={r.id}>{r.client_user_id} · {r.id}</option>)}</select></label><Field label="Days" type="number" min={1} max={365} value={days} required onChange={event => setDays(Number(event.target.value))} /><Field label="Audit reason" value={reason} required maxLength={500} onChange={event => setReason(event.target.value)} /><button className="button" disabled={mutation.busy}>Grant complimentary access</button></form></div>
    <h2>Workspaces</h2>{data.workspaces.map(w => <article key={w.id} className="gymaf-panel"><h3>{w.name}</h3><p>{w.slug} · {w.published ? "Public profile enabled" : "Profile unpublished"}</p><BillingSetup workspaceId={w.id}/></article>)}
    <h2>Requests</h2>{!data.requests.length && <Empty>No support or data requests.</Empty>}{data.requests.map(request => <RequestReview key={`${request.id}:${request.state}:${request.resolution}`} request={request} reload={resource.reload} />)}
  </div>;
}
