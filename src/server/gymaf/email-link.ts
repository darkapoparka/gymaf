import { NextResponse, type NextRequest } from "next/server";
import { object } from "@/shared/gymaf/validation";
import { config, HttpError, provider, rpc, setTokens, success, verifiedUser } from "./http";
import { createPkce, validVerifier } from "./pkce";

function verifierCookie() {
  return config().secure ? "__Host-gymaf-pkce" : "gymaf-pkce";
}
const cookieOptions = () => ({ httpOnly: true, secure: config().secure, sameSite: "lax" as const, path: "/" });

export async function requestEmailLink(email: string) {
  const { verifier, challenge } = createPkce();
  const redirect = `${config().origin}/auth/callback`;
  await provider(`/auth/v1/otp?redirect_to=${encodeURIComponent(redirect)}`, {
    email, create_user: true, code_challenge: challenge, code_challenge_method: "s256",
  });
  const response = success({ requested: true });
  response.cookies.set(verifierCookie(), verifier, { ...cookieOptions(), maxAge: 3600 });
  return response;
}

function redirectTo(path: string) {
  const response = NextResponse.redirect(new URL(path, config().origin), 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function completeEmailLink(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code || !/^[0-9a-f-]{36}$/i.test(code) || request.nextUrl.searchParams.has("error")) {
    return redirectTo("/login?error=invalid-link");
  }
  const verifier = request.cookies.get(verifierCookie())?.value;
  if (!validVerifier(verifier)) return redirectTo("/login?error=different-browser");
  try {
    const tokens = object(await provider("/auth/v1/token?grant_type=pkce", { auth_code: code, code_verifier: verifier }));
    if (typeof tokens.access_token !== "string") throw new HttpError(503, "INVALID_AUTH_RESPONSE", "No session was returned.");
    await verifiedUser(tokens.access_token);
    await rpc("gymaf_register_session", {}, tokens.access_token);
    const response = setTokens(redirectTo("/app"), tokens);
    response.cookies.set(verifierCookie(), "", { ...cookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    // Never reflect provider payloads, codes or caller-supplied destinations into redirects/logs.
    return redirectTo(error instanceof HttpError && error.status >= 500 ? "/login?error=unavailable" : "/login?error=invalid-link");
  }
}
