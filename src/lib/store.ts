"use client";
import { commercialGymEquipment } from "./equipment";
import { useContext, useMemo, useSyncExternalStore } from "react";

import { CaptureDataContext } from "./capture-context";

export type LocalData = {
  favorites: string[];
  goal: string;
  name: string;
  interest: string;
  messages: { id: string; text: string; photo?: string; video?: string }[];
  completed: string[];
  sessions: Record<string, { seconds: number; reps: string }>;
  feedback: Record<string, { rating: number; text: string }>;
  events: { id: string; name: string; date: string }[];
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
  const raw = useSyncExternalStore(subscribe, read, () => fallback);
  const data = useMemo(
    () => {
      const value = { ...initial, ...JSON.parse(raw) } as LocalData;
      // Upgrade only the untouched early demo fixture; retain every edited location.
      value.locations = value.locations.map(location => location.id === "equinox" && JSON.stringify(location.equipment) === JSON.stringify(["Dumbbell", "Barbell", "Bench", "Cable Machine", "Treadmill"]) ? { ...location, equipment: commercialGymEquipment } : location);
      return value;
    },
    [raw],
  );
  function update(
    change: Partial<LocalData> | ((current: LocalData) => Partial<LocalData>),
  ) {
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
  }
  return capture ? { data: { ...initial, ...capture.data }, update: (change: Partial<LocalData> | ((current: LocalData) => Partial<LocalData>)) => capture.update(change, initial) } : { data, update };
}
