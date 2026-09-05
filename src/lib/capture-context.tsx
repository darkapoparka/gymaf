"use client";
import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import type { LocalData } from "./store";

export type CaptureFixture = {
  id: string;
  data: Partial<LocalData>;
  ui: Record<string, unknown>;
};
type Change = Partial<LocalData> | ((current: LocalData) => Partial<LocalData>);
export const CaptureDataContext = createContext<{
  data: Partial<LocalData>;
  update: (change: Change, initial: LocalData) => void;
} | null>(null);
const CaptureContext = createContext<CaptureFixture | null>(null);
function createCaptureStore(seed: Partial<LocalData>) {
  let snapshot = seed;
  const listeners = new Set<() => void>();
  return {
    read: () => snapshot,
    subscribe: (callback: () => void) => { listeners.add(callback); return () => listeners.delete(callback); },
    update: (change: Change, initial: LocalData) => {
      const current = { ...initial, ...snapshot };
      snapshot = { ...snapshot, ...(typeof change === "function" ? change(current) : change) };
      listeners.forEach(callback => callback());
    },
  };
}
type CaptureStore = ReturnType<typeof createCaptureStore>;
const sessions = new Map<string, CaptureStore>();

/** Reference fixtures are isolated in React memory; they never overwrite the user's saved app data. */
export function CaptureProvider({ fixture, children }: { fixture: CaptureFixture; children: ReactNode }) {
  const [session] = useState(() => {
    // SSR has no persistent session. A browser document retains a preview across local route changes.
    if (typeof window === "undefined") return createCaptureStore(fixture.data);
    if (!sessions.has(fixture.id)) sessions.set(fixture.id, createCaptureStore(fixture.data));
    return sessions.get(fixture.id)!;
  });
  const data = useSyncExternalStore(session.subscribe, session.read, () => fixture.data);
  return <CaptureContext.Provider value={fixture}><CaptureDataContext.Provider value={{ data, update: session.update }}>{children}</CaptureDataContext.Provider></CaptureContext.Provider>;
}
export function useCapture() { return useContext(CaptureContext); }
export function useCaptureState<T>(key: string, fallback: T | (() => T)) {
  const capture = useCapture();
  return useState<T>(() => capture && Object.hasOwn(capture.ui, key)
    ? capture.ui[key] as T
    : typeof fallback === "function" ? (fallback as () => T)() : fallback);
}
