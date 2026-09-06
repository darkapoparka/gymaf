"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Bootstrap } from "@/shared/gymaf/contracts";
import { ClientArea } from "./client";
import { CoachArea } from "./coach";
import { OperatorArea } from "./operator";
import { SessionScreen } from "./session";
import { clearPhotoDrafts } from "./media-drafts";
import { clearRatingDrafts } from "./rating-drafts";
import { clearAccountDrafts } from "./account-drafts";
import { clearProfileDrafts } from "./profile-drafts";
import { clearFeedbackDrafts } from "./feedback-drafts";
import { Settings } from "lucide-react";
import { Navigation, Note, Pending, useResource } from "./ui";

export function ConnectedApp({ area, path = [], relationshipId, workspaceId }: { area: "app" | "coach" | "operator"; path?: string[]; relationshipId?: string; workspaceId?: string }) {
  const account = useResource<Bootstrap>("me"), [expired,setExpired] = useState(false);
  useEffect(() => {
    const expire = () => {clearFeedbackDrafts();clearPhotoDrafts();clearProfileDrafts();clearAccountDrafts();clearRatingDrafts();setExpired(true);};
    window.addEventListener("gymaf-session-expired",expire);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("gymaf-session") : null;
    if (channel) channel.onmessage=expire;
    const pageShow = (event: PageTransitionEvent) => { if (event.persisted) { setExpired(true); window.location.reload(); } };
    window.addEventListener("pageshow",pageShow);
    return () => { window.removeEventListener("gymaf-session-expired",expire); window.removeEventListener("pageshow",pageShow); channel?.close(); };
  }, []);
  const data = account.data;
  if (expired) return <main className="app-shell gymaf-connected"><Note>Your session changed or expired. Private data has been hidden.</Note><Link href="/login" className="button primary">Sign in again</Link></main>;
  if (!data) return <main className="app-shell gymaf-connected"><Pending error={account.error} reload={account.reload} /></main>;
  const selected = data.relationships.find(r => r.id === relationshipId) || data.relationships.find(r => r.state === "active" || r.state === "paused") || data.relationships[0];
  const query = area === "app" && selected ? `?relationship=${selected.id}` : area === "coach" && workspaceId ? `?workspace=${workspaceId}` : "";
  const sessionId = path[0] === "sessions" ? path[1] : undefined;
  return <div className={`gymaf-connected ${area==="app"?"gymaf-client":""} ${sessionId?"gymaf-player-shell":""}`} lang={data.user.locale}><header className="gymaf-topline"><Link href="/" className="wordmark">Gymaf</Link><div className="gymaf-account-links"><Link href="/app">Client</Link>{data.workspaces.length>0 && <Link href="/coach">Coach</Link>}{data.operator && <Link href="/operator">Operator</Link>}<Link href="/app/profile">Account</Link></div></header>
    <details className="gymaf-build-info"><summary aria-label="Environment and account menu"><Settings size={19}/><span>Environment</span></summary><div><p>{data.local_mode ? "Synthetic local environment · no live payments · MFA bypass is local-only" : "Pre-release integration build · not approved for real client data or public launch"}</p><Link href="/app/settings">Account settings</Link>{data.workspaces.length>0&&<Link href="/coach">Coach workspace</Link>}{data.operator&&<Link href="/operator">Operator</Link>}</div></details>
    <a href="#main" className="skip-link">Skip to content</a>
    <main id="main" className={`app-shell ${area==="app"?`connected-route-${path[0]||"home"}`:""} ${area === "app" && !path.length ? "home-page" : ""}`}>
      {sessionId ? <SessionScreen ownerId={data.user.id} key={sessionId} id={sessionId} back={area === "coach" ? "/coach" : `/app/history${query}`} /> : area === "operator" ? <OperatorArea /> : area === "coach" ? <CoachArea account={data} path={path} workspaceId={workspaceId} reloadAccount={account.reload} /> : <ClientArea account={data} path={path} selectedId={relationshipId} reloadAccount={account.reload} />}
    </main>
    {area !== "operator" && !sessionId && !(area === "app" && (path[0] === "account" || path[0] === "schedule" || path[0] === "settings" || (path[0] === "progress" && path[1] !== "photos") || (path[0] === "profile" && path[1]) || path[0] === "workouts")) && <Navigation area={area} active={path[0] === "progress" ? "history" : path[0] || ""} locale={data.user.locale} query={query} />}
  </div>;
}
