"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Bootstrap, CommandResult, RelationshipDetail, MemberRecord, MemberMedia, WorkoutFavorite } from "@/shared/gymaf/contracts";
import { media, workouts as referenceWorkouts, type Workout } from "@/lib/data";
import { api, ApiError, command } from "./api";
import { BackendLogin } from "@/components/backend/login";
import { clearPrivateDrafts } from '@/features/gymaf/api';

type Backend = {
  account: Bootstrap; relationship: RelationshipDetail | null; workouts: Workout[];
  records: MemberRecord[]; photos: MemberMedia[]; favorites: WorkoutFavorite[];
  reload: () => Promise<void>; run: (action: string, payload: Record<string, unknown>) => Promise<CommandResult>;
  busy: boolean; report: (message: string) => void;
};
const Context = createContext<Backend | null>(null);
export const useBackend = () => useContext(Context);
export function useWorkoutCatalog() { return useBackend()?.workouts ?? referenceWorkouts; }

export function BackendProvider({ children, relationshipId, linkMode=false }: { children: React.ReactNode; relationshipId?: string; linkMode?:boolean }) {
  const [account, setAccount] = useState<Bootstrap | null>(null);
  const [relationship, setRelationship] = useState<RelationshipDetail | null>(null);
  const [records, setRecords] = useState<MemberRecord[]>([]), [photos, setPhotos] = useState<MemberMedia[]>([]), [favorites, setFavorites] = useState<WorkoutFavorite[]>([]);
  const [ready, setReady] = useState(false), [error, setError] = useState(""), [pending, setPending] = useState(0);
  const sequence = useRef(0), retries = useRef(new Map<string, string>());
  const reload = useCallback(async () => {
    const current = ++sequence.current;
    try {
      const next = await api<Bootstrap>("me");
      const selected = next.relationships.find(r => r.id === relationshipId) || next.relationships.find(r => r.state === "active" || r.state === "paused") || next.relationships[0];
      const [detail, memberRecords, memberPhotos, memberFavorites] = await Promise.all([
        selected ? api<RelationshipDetail>(`relationships/${selected.id}`) : null,
        api<MemberRecord[]>('me/details'), api<MemberMedia[]>('me/media'),
        selected ? api<WorkoutFavorite[]>(`relationships/${selected.id}/favorites`) : [],
      ]);
      if (current !== sequence.current) return;
      setAccount(next); setRelationship(detail); setRecords(memberRecords); setPhotos(memberPhotos); setFavorites(memberFavorites); setError("");
    } catch (failure) {
      if (current !== sequence.current) return;
      if (failure instanceof ApiError && failure.status === 401) { setAccount(null); setRelationship(null); retries.current.clear(); }
      else setError(failure instanceof Error ? failure.message : "Unable to load your account.");
    } finally { if (current === sequence.current) setReady(true); }
  }, [relationshipId]);
  const invalidate = useCallback(() => { sequence.current++; }, []);
  useEffect(() => {
    const initial = window.setTimeout(() => void reload(), 0);
    const channel = new BroadcastChannel("gymaf-session");
    const changed = () => { clearPrivateDrafts(); retries.current.clear(); setAccount(null); setRelationship(null); setReady(false); void reload(); };
    channel.onmessage = changed;
    const focus = () => { void reload(); };
    const expired = () => { clearPrivateDrafts(); sequence.current++; setAccount(null); setRelationship(null); setReady(true); retries.current.clear(); };
    window.addEventListener("focus", focus);
    window.addEventListener("gymaf-session-expired", expired);
    return () => { window.clearTimeout(initial); invalidate(); channel.close(); window.removeEventListener("focus", focus); window.removeEventListener("gymaf-session-expired", expired); };
  }, [reload, invalidate]);
  const run = useCallback(async (action: string, payload: Record<string, unknown>) => {
    const key = JSON.stringify([account?.user.id, action, payload]);
    const id = retries.current.get(key) || crypto.randomUUID(); retries.current.set(key, id);
    setPending(n => n + 1); setError("");
    try { const result = await command(action, payload, id); retries.current.delete(key); await reload(); return result; }
    catch (failure) { setError(failure instanceof Error ? failure.message : "The change could not be saved."); throw failure; }
    finally { setPending(n => n - 1); }
  }, [account?.user.id, reload]);
  const workouts = useMemo<Workout[]>(() => (relationship?.workouts || []).map(w => ({
    id: w.id, title: w.prescription.title, category: "Training", intensity: "Assigned",
    minutes: Math.max(1, Math.round(w.prescription.exercises.reduce((total, e) => total + e.sets.reduce((n, s) => n + (s.durationSeconds || 30) + s.restSeconds, 0), 0) / 60)),
    image: /yoga/i.test(w.prescription.title) ? media.yoga : {...media.home,y:media.home.y+135,h:media.home.h-135}, equipment: "See your assigned sets", description: w.prescription.exercises.map(e => e.name).join(" · "),
    prescription: w.prescription,
  })), [relationship]);
  if (!ready) return <main className="app-shell" aria-busy="true"><p className="note">Loading your account…</p></main>;
  if (!account) return <BackendLogin linkMode={linkMode} onSignedIn={reload} initialError={error} />;
  return <Context.Provider key={account.user.id} value={{ account, relationship, workouts, records, photos, favorites, reload, run, busy: pending > 0, report: setError }}>
    {error && <div role="alert" className="note"><p>{error}</p><button className="text-button" onClick={() => void reload()}>Reload saved data</button></div>}
    {children}
  </Context.Provider>;
}
