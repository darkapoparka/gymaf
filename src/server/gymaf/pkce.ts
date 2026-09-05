import { createHash, randomBytes } from "node:crypto";

export function codeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}
export function createPkce() {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: codeChallenge(verifier) };
}
export function validVerifier(value: string | undefined): value is string {
  return !!value && /^[A-Za-z0-9._~-]{43,128}$/.test(value);
}
