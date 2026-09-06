import type { NextRequest } from "next/server";
import { requestEmailLink } from "./email-link";
import { email, object, text, uuid, InputError } from "@/shared/gymaf/validation";
import { accessToken, clearTokens, cookieNames, HttpError, provider, readBody, rpc, sameOrigin, setTokens, success, verifiedUser } from "./http";

export async function authPost(request: NextRequest, action: string) {
  sameOrigin(request);
  const body = await readBody(request);
  if (action === "request-link") return requestEmailLink(email(body.email));
  if (action === "request-code") {
    // Provider rate limits apply. Add approved edge/IP throttling before public release.
    await provider("/auth/v1/otp", { email: email(body.email), create_user: true });
    return success({ requested: true });
  }
  if (action === "verify-code") {
    const code = text(body.code, "Code", 10, 6); if (!/^\d{6,10}$/.test(code)) throw new InputError("Enter the code from your email.");
    const tokens = object(await provider("/auth/v1/verify", { email: email(body.email), token: code, type: "email" }));
    if (typeof tokens.access_token !== "string") throw new HttpError(503, "INVALID_AUTH_RESPONSE", "No session was returned.");
    await verifiedUser(tokens.access_token);
    await rpc("gymaf_register_session", {}, tokens.access_token);
    return setTokens(success({ signedIn: true }), tokens);
  }
  if (action === "refresh") {
    const refreshToken = request.cookies.get(cookieNames().refresh)?.value;
    if (!refreshToken || refreshToken.length > 8192) throw new HttpError(401, "SIGN_IN_REQUIRED", "Please sign in again.");
    const tokens = object(await provider("/auth/v1/token?grant_type=refresh_token", { refresh_token: refreshToken }));
    if (typeof tokens.access_token !== "string") throw new HttpError(401, "SIGN_IN_REQUIRED", "Please sign in again.");
    await verifiedUser(tokens.access_token);
    // A revoked application session cannot register itself again, even with a valid provider JWT.
    await rpc("gymaf_register_session", {}, tokens.access_token);
    return setTokens(success({ refreshed: true }), tokens);
  }
  const token = accessToken(request);
  await verifiedUser(token);
  if (action === "logout") {
    // Fail visibly if server revocation is unavailable; do not claim successful remote revocation.
    await rpc("gymaf_revoke_session", {}, token);
    await provider("/auth/v1/logout?scope=local", {}, token).catch(() => null);
    return clearTokens(success({ signedOut: true, applicationSessionRevoked: true }));
  }
  if (action === "mfa-enroll") return success(await provider("/auth/v1/factors", { factor_type: "totp", friendly_name: "Gymaf authenticator" }, token));
  if (action === "mfa-verify") {
    const factor = uuid(body.factorId), code = text(body.code, "Authenticator code", 6, 6);
    if (!/^\d{6}$/.test(code)) throw new InputError("Enter the six-digit authenticator code.");
    const challenge = object(await provider(`/auth/v1/factors/${factor}/challenge`, {}, token));
    const tokens = await provider(`/auth/v1/factors/${factor}/verify`, { challenge_id: uuid(challenge.id), code }, token);
    return setTokens(success({ verified: true }), tokens);
  }
  throw new HttpError(404, "NOT_FOUND", "Unknown authentication operation.");
}
