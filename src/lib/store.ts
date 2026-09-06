"use client";
import { commercialGymEquipment } from "./equipment";
import { useContext, useMemo, useSyncExternalStore } from "react";

import { CaptureDataContext } from "./capture-context";
import { useBackend } from "./backend/context";
import { memberView, memberChanges } from "./backend/member-adapter";
import { preferenceDefaults } from "@/shared/gymaf/member-preferences";

export type LocalData = {
  favorites: string[];
  goal: string;
  name: string;
  interest: string;
  messages: { id: string; text: string; photo?: string; video?: string }[];
  completed: string[];
  sessions: Record<string, { seconds: number; reps: string }>;
  feedback: Record<string, { rating: number; text: string }>;
  events: { id: string; name: string; date: string; endDate?: string; details?: string; type?: string; training?: string }[];
  weight: string;
  schedule: Record<string, string>;
  privateProfile: boolean;
  preferences: Record<string, string>;
  locations: { id: string; name: string; kind: string; equipment: string[] }[];
  injuries: {
    id: string;
    description: string;
    affectsMovement: boolean;
    excluded: string[];
  }[];
  photos: { id: string; src: string; date: string; kind: string }[];
  weightHistory: { id: string; value: string; date: string }[];
};
const initial: LocalData = {
  favorites: [],
  goal: "Lose Weight",
  name: "Alex Smith",
  interest: "running",
  messages: [],
  completed: [],
  sessions: {},
  feedback: {},
  events: [
    {
      id: "reference-event",
      name: "5K Jakarta Open Trail Run",
      date: "2026-07-26",
    },
  ],
  weight: "",
  schedule: { Tuesday: "morning-yoga" },
  privateProfile: false,
  preferences: {},
  locations: [
    {
      id: "home",
      name: "Home",
      kind: "Home",
      equipment: ["Dumbbell", "Yoga Mat"],
    },
    {
      id: "equinox",
      name: "Equinox",
      kind: "Commercial Gym",
      equipment: commercialGymEquipment,
    },
  ],
  injuries: [],
  photos: [],
  weightHistory: [],
};
const fallback = JSON.stringify(initial);
let memorySnapshot = fallback;
let storageUnavailable = false;
const key = "future-pro-local-v1";
function read() {
  if (storageUnavailable) return memorySnapshot;
  try {
    const value = localStorage.getItem(key);
    if (value) {
      const parsed = JSON.parse(value);
      if (
        parsed &&
        Array.isArray(parsed.favorites) &&
        typeof parsed.name === "string"
      )
        return value;
    }
  } catch {}
  return memorySnapshot;
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("future-pro-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("future-pro-change", callback);
  };
}
export function useLocalData() {
  const capture = useContext(CaptureDataContext);
  const backend = useBackend();
  const uiKey = backend ? "gymaf-ui:" + backend.account.user.id : "";
  const raw = useSyncExternalStore(subscribe, () => {
    if (!backend) return read();
    try { return localStorage.getItem(uiKey) || "{}"; } catch { return "{}"; }
  }, () => backend ? "{}" : fallback);
  const data = useMemo(
    () => {
      if (backend) {
        const ui = JSON.parse(raw), profile = backend.account.user, sessions = backend.relationship?.sessions || [];
        const member = memberView(backend.records);
        return { ...initial, ...member, name: profile.display_name, goal: profile.goal, interest: (profile.interests || []).join(' '),
          favorites: backend.favorites.filter(f => f.favorite).map(f => f.scheduled_id), preferences: {...ui.preferences, ...member.preferences},
          messages: [], photos: backend.photos.filter(p => p.kind === 'progress').map(p => ({id:p.id,src:'',date:p.taken_on,kind:p.view})), feedback: {},
          completed: sessions.filter(s => s.state === "completed").map(s => s.scheduled_workout_id),
          sessions: Object.fromEntries(sessions.map(s => [s.id, { seconds: s.elapsed_seconds, reps: "" }])),
          schedule: Object.fromEntries((backend.relationship?.workouts || []).filter(w => w.state === "assigned").map(w => [w.scheduled_date + " · " + w.prescription.title, w.id])),
        } as LocalData;
      }
      const value = { ...initial, ...JSON.parse(raw) } as LocalData;
      // Upgrade only the untouched early demo fixture; retain every edited location.
      value.locations = value.locations.map(location => location.id === "equinox" && JSON.stringify(location.equipment) === JSON.stringify(["Dumbbell", "Barbell", "Bench", "Cable Machine", "Treadmill"]) ? { ...location, equipment: commercialGymEquipment } : location);
      return value;
    },
    [raw, backend],
  );
  function update(
    change: Partial<LocalData> | ((current: LocalData) => Partial<LocalData>),
  ) {
    if (backend && !capture) {
      const patch = typeof change === "function" ? change(data) : change;
      const unsupported = Object.keys(patch).filter(k => !["name", "goal", "interest", "privateProfile", "favorites", "preferences", "events", "locations", "injuries", "weightHistory", "weight"].includes(k));
      if (unsupported.length) { backend.report("This action is not connected yet. No changes were saved."); return Promise.resolve(false); }
      const save = async () => {
        try {
          if (patch.name !== undefined || patch.goal !== undefined || patch.interest !== undefined) {
            const p = backend.account.user;
            await backend.run("profile.save", { displayName: patch.name ?? p.display_name, goal: patch.goal ?? p.goal, interests: patch.interest !== undefined ? patch.interest.split(/[ ,#]+/).filter(Boolean) : p.interests || [], locale: p.locale, timezone: p.timezone, equipment: p.equipment, availability: p.availability, revision: p.revision });
          }
          for (const change of memberChanges(patch,data,backend.records)) await backend.run(change.action,change.payload);
          if (patch.favorites) {
            for (const id of new Set([...data.favorites,...patch.favorites])) {
              const favorite = patch.favorites.includes(id);
              if (favorite === data.favorites.includes(id)) continue;
              await backend.run('training.favorite',{scheduledId:id,favorite,revision:backend.favorites.find(f => f.scheduled_id === id)?.revision || 0});
            }
          }
          if (patch.preferences) {
            const record=backend.records.find(r => r.kind === 'preferences');
            const next={...preferenceDefaults,...record?.data};
            for (const key of Object.keys(preferenceDefaults)) if (patch.preferences[key] !== undefined) (next as Record<string,unknown>)[key] = ['privateProfile','countdown','vibration'].includes(key) ? patch.preferences[key] === 'true' : patch.preferences[key];
            next.privateProfile=true;
            if (JSON.stringify(next) !== JSON.stringify({...preferenceDefaults,...record?.data})) await backend.run('member.save',{id:record?.id || crypto.randomUUID(),kind:'preferences',data:next,revision:record?.revision || 0});
            if (patch.preferences.targetWeight !== undefined && patch.preferences.targetWeight !== data.preferences.targetWeight) {
              const target=backend.records.find(r => r.kind === 'weight-target');
              await backend.run('member.save',{id:target?.id || crypto.randomUUID(),kind:'weight-target',data:{valueKg:Number((Number(patch.preferences.targetWeight)/(data.preferences.weightUnit === 'lb'?2.2046226218:1)).toFixed(4))},revision:target?.revision || 0});
            }
            // Only display selections are local. Domain records above require a server acknowledgement.
            localStorage.setItem(uiKey, JSON.stringify({ preferences: patch.preferences }));
            window.dispatchEvent(new Event("future-pro-change"));
          }
          return true;
        } catch { return false; }
      };
      return save();
    }
    const current = { ...initial, ...JSON.parse(read()) } as LocalData;
    current.locations = current.locations.map(location => location.id === "equinox" && JSON.stringify(location.equipment) === JSON.stringify(["Dumbbell", "Barbell", "Bench", "Cable Machine", "Treadmill"]) ? { ...location, equipment: commercialGymEquipment } : location);
    memorySnapshot = JSON.stringify({
      ...current,
      ...(typeof change === "function" ? change(current) : change),
    });
    try {
      localStorage.setItem(key, memorySnapshot);
      storageUnavailable = false;
    } catch { storageUnavailable = true; }
    window.dispatchEvent(new Event("future-pro-change"));
    return Promise.resolve(true);
  }
  return capture ? { data: { ...initial, ...capture.data }, update: (change: Partial<LocalData> | ((current: LocalData) => Partial<LocalData>)) => { capture.update(change, initial); return Promise.resolve(true); } } : { data, update };
}
