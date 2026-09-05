import test from 'node:test';
import assert from 'node:assert/strict';
import { codeChallenge, createPkce, validVerifier } from '../../src/server/gymaf/pkce.ts';

test('S256 matches the RFC 7636 reference vector', () => {
  assert.equal(codeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});
test('login attempts use independent valid PKCE verifiers', () => {
  const first = createPkce(), second = createPkce();
  assert.equal(validVerifier(first.verifier), true);
  assert.equal(first.verifier.length, 43);
  assert.notEqual(first.verifier, second.verifier);
  assert.notEqual(first.challenge, second.challenge);
});
test('missing, oversized and malformed verifier cookies are rejected', () => {
  for (const value of [undefined, '', 'a'.repeat(42), 'a'.repeat(129), 'a'.repeat(42) + '=', 'a'.repeat(42) + '\n']) {
    assert.equal(validVerifier(value), false);
  }
});
