"use client";
import type { CommandResult } from "@/shared/gymaf/contracts";

export class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
let refreshing: Promise<boolean> | null = null;
async function refresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  const run = async () => { const response = await fetch("/api/v1/auth/refresh", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: "{}", signal: AbortSignal.timeout(20000) }); return response.ok; };
  refreshing = (typeof navigator !== "undefined" && navigator.locks ? navigator.locks.request("gymaf-refresh", run) : run()).catch(() => false).finally(() => { refreshing = null; });
  return refreshing;
}
export async function api<T>(path: string, options: { method?: "GET" | "POST"; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const request = () => fetch("/api/v1/" + path, { method: options.method || "GET", credentials: "same-origin", cache: "no-store", signal: options.signal || AbortSignal.timeout(20000), ...(options.body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(options.body) } : {}) });
  let response = await request();
  const canRefresh = !["auth/request-code", "auth/verify-code", "auth/refresh"].includes(path);
  if (response.status === 401 && canRefresh && await refresh()) response = await request();
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event("gymaf-session-expired"));
    throw new ApiError(response.status, result?.error?.code || "REQUEST_FAILED", result?.error?.message || "The request failed. Please retry.");
  }
  if ((path === "auth/verify-code" || path === "auth/logout") && typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel("gymaf-session"); channel.postMessage("changed"); channel.close(); }
  return result.data as T;
}
export function command(action: string, payload: Record<string, unknown>, commandId: string): Promise<CommandResult> { return api("commands", { method: "POST", body: { action, payload, commandId } }); }
export function invitationToken(): string { return [...crypto.getRandomValues(new Uint8Array(32))].map(byte => byte.toString(16).padStart(2, "0")).join(""); }
