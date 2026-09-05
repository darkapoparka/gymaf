"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthFactor, Bootstrap } from "@/shared/gymaf/contracts";
import { api } from "./api";
import { ErrorNote, Field, Head, Note, useCommand, useResource } from "./ui";

export function LoginForm({ onSignedIn }: { onSignedIn?: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState(""), [code, setCode] = useState(""), [requested, setRequested] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function submit() {
    if (busy) return; setBusy(true); setError("");
    try {
      if (!requested) { await api("auth/request-code", { method: "POST", body: { email } }); setRequested(true); }
      else { await api("auth/verify-code", { method: "POST", body: { email, code } }); if (onSignedIn) onSignedIn(); else router.replace("/app"); }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Sign-in failed."); }
    finally { setBusy(false); }
  }
  return <form className="gymaf-stack" onSubmit={event => { event.preventDefault(); void submit(); }}>
    <Field label="Email / Имейл" type="email" required autoComplete="email" maxLength={254} value={email} disabled={requested || busy} onChange={event => setEmail(event.target.value)} />
    {requested && <><Note>A one-time code was requested. Check your email, including spam. Local test codes appear in the local Supabase email inbox.</Note><Field label="Sign-in code / Код за вход" autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} required value={code} onChange={event => setCode(event.target.value)} /></>}
    <ErrorNote message={error} />
    <button className="button primary full" disabled={busy}>{busy ? "Connecting…" : requested ? "Sign in / Вход" : "Send code / Изпрати код"}</button>
    {requested && <button type="button" className="button full" disabled={busy} onClick={() => { setRequested(false); setCode(""); setError(""); }}>Change email or request another code</button>}
  </form>;
}
export function LoginPage() { return <main className="app-shell immersive gymaf-connected"><Head title="Welcome to Gymaf" back="/" /><section className="gymaf-panel gymaf-stack"><h2>Your coach. Your training.</h2><p>Влезте с еднократен код, изпратен на имейла ви.</p><LoginForm /><Note>Pre-release validation build. Use synthetic accounts, not real client or health data.</Note></section></main>; }
export function JoinPage() {
  const [token, setToken] = useState(""), [ready, setReady] = useState(false);
  const account = useResource<Bootstrap>("me"), mutation = useCommand(), router = useRouter();
  useEffect(() => { const t = new URLSearchParams(window.location.hash.slice(1)).get("token") || ""; const task = window.setTimeout(() => { setToken(t); setReady(true); window.history.replaceState(null, "", "/join"); }, 0); return () => clearTimeout(task); }, []);
  async function accept() { if (await mutation.run("invitation.accept", { token })) router.replace("/app/profile"); }
  return <main className="app-shell immersive gymaf-connected"><Head title="Join your coach" back="/" /><section className="gymaf-panel gymaf-stack">{!ready ? <p>Reading invitation…</p> : !token ? <p>Open the original invitation link. Invitation tokens are kept in memory only and are removed from the address bar.</p> : !account.data ? <><p>Sign in using the email address your coach invited.</p><LoginForm onSignedIn={account.reload} /></> : <><p>Accept this invitation for your signed-in account. An existing active coaching relationship will not be replaced.</p><button className="button primary full" disabled={mutation.busy} onClick={() => void accept()}>Accept invitation</button><ErrorNote message={mutation.error} /></>}</section></main>;
}
export function MfaSettings({ onVerified }: { onVerified: () => void }) {
  const factors = useResource<{ factors: AuthFactor[] }>("auth/factors");
  const [enrollment, setEnrollment] = useState<{ id: string; totp: { secret: string; uri: string; qr_code: string } } | null>(null);
  const [factorId, setFactorId] = useState(""), [code, setCode] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const verifiedFactors = factors.data?.factors.filter(f => f.factor_type === "totp" && f.status === "verified") || [];
  async function enroll() { setBusy(true); setError(""); try { const result = await api<{ id: string; totp: { secret: string; uri: string; qr_code: string } }>("auth/mfa-enroll", { method: "POST", body: {} }); setEnrollment(result); } catch (failure) { setError(failure instanceof Error ? failure.message : "Enrollment failed."); } finally { setBusy(false); } }
  async function verify() { setBusy(true); setError(""); try { await api("auth/mfa-verify", { method: "POST", body: { factorId: enrollment?.id || factorId || verifiedFactors[0]?.id, code } }); setEnrollment(null); setCode(""); factors.reload(); onVerified(); } catch (failure) { setError(failure instanceof Error ? failure.message : "Verification failed."); } finally { setBusy(false); } }
  return <section className="gymaf-panel gymaf-stack"><h2>Authenticator security</h2><p>Coaches and operators require two-factor authentication outside the synthetic local environment.</p><ErrorNote message={factors.error || error} />
    {enrollment ? <><p>Add this setup key to your authenticator. It is displayed only during setup; do not share it.</p><code className="gymaf-secret">{enrollment.totp.secret}</code><p>Account: Gymaf · time-based code.</p></> : verifiedFactors.length ? <label className="form-field">Authenticator<select value={factorId || verifiedFactors[0].id} onChange={event => setFactorId(event.target.value)}>{verifiedFactors.map(f => <option key={f.id} value={f.id}>{f.friendly_name || "Authenticator"}</option>)}</select></label> : <button className="button" disabled={busy} onClick={() => void enroll()}>Set up authenticator</button>}
    {(enrollment || verifiedFactors.length > 0) && <form className="gymaf-stack" onSubmit={event => { event.preventDefault(); void verify(); }}><Field label="Authenticator code" value={code} onChange={event => setCode(event.target.value)} inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoComplete="one-time-code" /><button className="button primary" disabled={busy}>Verify authenticator</button></form>}
    <Link href="/login" className="text-button">Sign in again for a fresh authentication session</Link>
  </section>;
}
