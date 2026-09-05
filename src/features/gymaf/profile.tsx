"use client";
import { useState } from "react";
import Link from "next/link";
import type { Bootstrap, DataRequest, RelationshipDetail } from "@/shared/gymaf/contracts";
import { api } from "./api";
import { MfaSettings } from "./auth-ui";
import { ErrorNote, Field, Head, Note, Row, useCommand, useResource } from "./ui";

export function ProfileScreen({ account, relationship, reload, mode = "all", query = "" }: { account: Bootstrap; relationship?: RelationshipDetail; reload: () => void; mode?: "all" | "edit" | "settings" | "security" | "service" | "support"; query?: string }) {
  const u = account.user;
  const [form, setForm] = useState({ displayName: u.display_name, locale: u.locale, timezone: u.timezone, goal: u.goal, equipment: u.equipment, availability: u.availability });
  const [notice, setNotice] = useState(""), [externalError, setExternalError] = useState(""), [body, setBody] = useState(""), [kind, setKind] = useState<"support" | "export" | "deletion">("support"), [confirmed, setConfirmed] = useState(false);
  const mutation = useCommand(), requests = useResource<DataRequest[]>(mode === "all" || mode === "support" ? "me/requests" : null);
  const change = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  async function save() { if (await mutation.run("profile.save", { ...form, revision: u.revision })) { setNotice("Profile saved."); reload(); } }
  async function request() { if (kind === "deletion" && !confirmed) return; if (await mutation.run("request.create", { kind, body })) { setBody(""); setConfirmed(false); setNotice("Request recorded. It has not been fulfilled yet. Check its status below."); requests.reload(); } }
  async function logout() { setExternalError(""); try { await api("auth/logout", { method: "POST", body: {} }); window.location.replace("/login"); } catch (failure) { setExternalError(failure instanceof Error ? failure.message : "Server sign-out could not be confirmed. Please retry."); } }
  async function download() {
    setExternalError("");
    try { const data = await api<unknown>("me/export"); const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)], { type: "application/json" })); const a = document.createElement("a"); a.href=url; a.download="gymaf-export.json"; document.body.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url),1000); }
    catch (failure) { setExternalError(failure instanceof Error ? failure.message : "Export failed. Sign in again or request an export below."); }
  }
  return <div className={`gymaf-stack connected-account connected-account-${mode}`}><Head title={mode === 'edit' ? 'Edit Profile' : mode === 'security' ? 'Account Security' : mode === 'service' ? 'Membership' : mode === 'support' ? 'Help & Support' : u.locale === 'bg' ? 'Настройки' : 'Settings'} back={mode === 'all' ? undefined : `${mode === 'settings' || mode === 'edit' ? '/app/profile' : '/app/settings'}${query}`} />
    {mode === 'settings' && <div className="connected-settings-list"><h2>Account</h2><Row href={`/app/profile/edit${query}`} detail={u.display_name}>Your Profile</Row><Row href={`/app/settings/security${query}`}>Account Security</Row><Row href={`/app/settings/service${query}`}>Membership</Row><h2>Support</h2><Row href={`/app/settings/support${query}`}>Help &amp; Your Data</Row><Link className="row" href={`/app/messages${query}`}>Contact Your Coach</Link><p className="note">Gymaf · Pre-release integration build</p></div>}
    {(mode === 'all' || mode === 'edit') && <>
    <form className="gymaf-panel gymaf-stack" onSubmit={event => { event.preventDefault(); void save(); }}>
      <Field label="Display name / Име" maxLength={120} required value={form.displayName} onChange={event => change("displayName",event.target.value)} />
      <label className="form-field">Language / Език<select value={form.locale} onChange={event => change("locale",event.target.value)}><option value="bg">Български</option><option value="en">English</option></select></label>
      <Field label="Timezone" value={form.timezone} required maxLength={80} onChange={event => change("timezone",event.target.value)} />
      {([['goal','Training goal',500],['equipment','Available equipment',1000],['availability','Training availability',1000]] as const).map(([key,label,max]) => <label key={key} className="form-field">{label}<textarea value={form[key]} maxLength={max} onChange={event => change(key,event.target.value)} /></label>)}
      <Note>Do not enter medical histories, injury narratives, or real client information in this validation build.</Note><button className="button primary" disabled={mutation.busy}>Save profile</button>
    </form>
    </>}
    {(mode === "all" || mode === "security") && <MfaSettings onVerified={reload} />}
    {(mode === "all" || mode === "service") && relationship && <section className="gymaf-panel gymaf-stack"><h2>Coaching service</h2><p>{relationship.relationship.coach_name || "Your coach"} · {relationship.relationship.state}</p>{relationship.entitlements.map(e => <p key={e.id}>{e.source} · {e.state} · {new Date(e.ends_at).toLocaleDateString()}</p>)}
      <Note>No card is charged by this build. Canceling marks manual service access as non-renewing through its recorded end date; it does not issue a payment-provider refund.</Note>
      <button className="button" disabled={mutation.busy} onClick={async () => { if (window.confirm("Record cancellation through the current service end date?")) { if (await mutation.run("service.cancel", { relationshipId: relationship.relationship.id })) { setNotice("Cancellation recorded. No external payment action was performed."); reload(); } } }}>Cancel service</button>
    </section>}
    {mode === "service" && !relationship && <Note>No coaching membership is connected to your account.</Note>}
    {(mode === "all" || mode === "support") && <section className="gymaf-panel gymaf-stack"><h2>Support and your data</h2><button className="button" onClick={() => void download()}>Download my data</button>
      <form className="gymaf-stack" onSubmit={event => { event.preventDefault(); void request(); }}><label className="form-field">Request type<select value={kind} onChange={event => { setKind(event.target.value as typeof kind); setConfirmed(false); }}><option value="support">Support</option><option value="export">Export assistance</option><option value="deletion">Account deletion request</option></select></label><label className="form-field">Details<textarea value={body} maxLength={2000} onChange={event => setBody(event.target.value)} /></label>
        {kind === "deletion" && <label><input type="checkbox" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /> I understand this submits a request. It does not instantly erase my account.</label>}
        <button className="button" disabled={mutation.busy}>Submit request</button>
      </form>
      <Note>Requests appear in the operator inbox. Email delivery and automated erasure are not enabled in this build.</Note>
      <ErrorNote message={requests.error} />{requests.data?.map(request => <article key={request.id}><h3>{request.kind} · {request.state}</h3><p className="gymaf-pre">{request.resolution || "Awaiting operator review."}</p></article>)}
    </section>}
    <ErrorNote message={mutation.error || externalError} /><Note>{notice}</Note>{(mode === "all" || mode === "settings") && <button className="button full" onClick={() => void logout()}>Sign out</button>}
  </div>;
}
