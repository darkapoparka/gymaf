import { NextResponse, type NextRequest } from "next/server";
import { InputError, object } from "@/shared/gymaf/validation";

export class HttpError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
export function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const origin = process.env.APP_ORIGIN || (process.env.NODE_ENV === "development" ? "http://127.0.0.1:3210" : "");
  if (!url || !key || !origin) throw new HttpError(503, "SETUP_REQUIRED", "Configure APP_ORIGIN, SUPABASE_URL and the Supabase publishable key. See astra/LOCAL_TESTING.md.");
  const api = new URL(url), app = new URL(origin);
  const local = (u: URL) => ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  if ((api.protocol !== "https:" && !local(api)) || (app.protocol !== "https:" && !local(app)) || app.pathname !== "/" || app.search || app.hash || api.username || app.username || api.password || app.password) throw new HttpError(503, "INVALID_CONFIGURATION", "Use HTTPS origins outside local development.");
  if (key.startsWith("sb_secret_")) throw new HttpError(503, "INVALID_CONFIGURATION", "The application must not use a Supabase secret/service-role key.");
  if (key.split(".").length === 3) {
    try { if (JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role === "service_role") throw new HttpError(503, "INVALID_CONFIGURATION", "Use the anonymous/publishable key, not the service-role key."); } catch (error) { if (error instanceof HttpError) throw error; }
  }
  return { url: api.origin, key, origin: app.origin, secure: app.protocol === "https:" };
}
export function cookieNames() { return config().secure ? { access: "__Host-gymaf-access", refresh: "__Host-gymaf-refresh" } : { access: "gymaf-access", refresh: "gymaf-refresh" }; }
export function accessToken(request: NextRequest): string {
  const bearer = request.headers.get("authorization");
  const cookie = request.cookies.get(cookieNames().access)?.value;
  if (bearer && cookie) throw new HttpError(400, "CONFLICTING_IDENTITY", "Use one authentication method.");
  const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : cookie;
  if (!token || token.length > 8192) throw new HttpError(401, "SIGN_IN_REQUIRED", "Please sign in again.");
  return token;
}
export function sameOrigin(request: NextRequest) {
  if (request.headers.get("origin") !== config().origin || request.headers.get("sec-fetch-site") === "cross-site") throw new HttpError(403, "ORIGIN_REJECTED", "This request must originate from the application.");
}
export async function readBody(request: NextRequest): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new HttpError(415, "JSON_REQUIRED", "Send JSON.");
  const reader = request.body?.getReader(); if (!reader) throw new InputError("Missing request body.");
  let length = 0; const chunks: Uint8Array[] = [];
  try { for (;;) { const { done, value } = await reader.read(); if (done) break; length += value.byteLength; if (length > 65536) { await reader.cancel(); throw new HttpError(413, "BODY_TOO_LARGE", "Request exceeds 64 KiB."); } chunks.push(value); } } finally { reader.releaseLock(); }
  const body = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  try { return object(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body))); } catch (error) { if (error instanceof InputError) throw error; throw new InputError("Invalid JSON."); }
}
export function success(data: unknown, status = 200) { return NextResponse.json({ data, meta: { requestId: crypto.randomUUID() } }, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" } }); }
export function failure(error: unknown) {
  const requestId = crypto.randomUUID();
  const known = error instanceof HttpError ? error : error instanceof InputError ? new HttpError(422, "VALIDATION_ERROR", error.message) : new HttpError(500, "INTERNAL_ERROR", "The operation failed. Retry with the same command ID or contact support.");
  // Deliberately no tokens, URLs, request bodies, SQL or provider error payloads in logs.
  if (known.status >= 500) console.error("gymaf_request_failed", { requestId, code: known.code });
  return NextResponse.json({ error: { code: known.code, message: known.message, requestId } }, { status: known.status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
export async function provider(path: string, body?: unknown, token?: string, method = body === undefined ? "GET" : "POST"): Promise<unknown> {
  const c = config(); let response: Response;
  try { response = await fetch(c.url + path, { method, headers: { apikey: c.key, ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), cache: "no-store", signal: AbortSignal.timeout(15000) }); } catch { throw new HttpError(503, "PROVIDER_UNAVAILABLE", "The service is temporarily unavailable. Your operation may have completed; retry using the same command ID."); }
  const result: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (response.ok) return result;
  const code = result && typeof result === "object" && "code" in result ? String(result.code) : "";
  if (response.status === 429) throw new HttpError(429, "RATE_LIMITED", "Too many requests. Please try again later.");
  if (code === "28000" || code === "PGRST301" || response.status === 401) throw new HttpError(401, "SIGN_IN_REQUIRED", "Please sign in again.");
  if (code === "42501" || response.status === 403) throw new HttpError(403, "ACCESS_DENIED", "You do not have access, your service has ended, or MFA is required.");
  if (code === "P0002") throw new HttpError(404, "NOT_FOUND", "This record is unavailable.");
  if (["40001", "23505", "GY409"].includes(code)) throw new HttpError(409, "CONFLICT", "The record changed or this command ID was reused with different data. Refresh before editing; retry unchanged requests with their original ID.");
  if (["22023", "22P02", "22007", "23514", "23503", "22001", "22003"].includes(code)) throw new HttpError(422, "VALIDATION_ERROR", "The values or requested state transition are not valid.");
  if (code.startsWith("PGRST") || code === "42P01" || code === "42883") throw new HttpError(503, "DATABASE_SETUP_REQUIRED", "Apply the Gymaf migrations to a local or isolated Supabase project.");
  if (path.startsWith("/auth/") && response.status < 500) throw new HttpError(400, "AUTHENTICATION_FAILED", "The code is invalid or expired, or the authentication request could not be completed.");
  throw new HttpError(503, "PROVIDER_UNAVAILABLE", "The service could not complete the request.");
}
export async function rpc(name: "gymaf_register_session" | "gymaf_revoke_session" | "gymaf_query" | "gymaf_command" | "gymaf_public_coach" | "gymaf_member_query" | "gymaf_member_command", args: Record<string, unknown>, token?: string): Promise<unknown> { return provider(`/rest/v1/rpc/${name}`, args, token); }
export async function verifiedUser(token: string) { const user = object(await provider("/auth/v1/user", undefined, token)); if (typeof user.id !== "string" || !user.email_confirmed_at) throw new HttpError(401, "VERIFY_EMAIL", "A verified email account is required."); return user; }
export function setTokens(response: NextResponse, raw: unknown) {
  const t = object(raw); if (typeof t.access_token !== "string" || typeof t.refresh_token !== "string" || typeof t.expires_in !== "number" || !Number.isFinite(t.expires_in)) throw new HttpError(503, "INVALID_AUTH_RESPONSE", "Authentication returned an invalid session.");
  const names = cookieNames(); const options = { httpOnly: true, secure: config().secure, sameSite: "lax" as const, path: "/" };
  response.cookies.set(names.access, t.access_token, { ...options, maxAge: Math.max(1, Math.min(86400, t.expires_in)) });
  response.cookies.set(names.refresh, t.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 14 });
  return response;
}
export function clearTokens(response: NextResponse) { for (const name of Object.values(cookieNames())) response.cookies.set(name, "", { httpOnly: true, secure: config().secure, sameSite: "lax", path: "/", maxAge: 0 }); return response; }
