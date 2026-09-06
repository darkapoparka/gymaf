// HTTP contract test against an isolated provider fixture, never the hosted database.
// Run npm run build first. No real emails or identities are used.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';

test('email link HTTP contract and session failure boundaries', { timeout: 45000 }, async () => {
  const calls = [];
  let registrationFails = false;
  const fixture = createServer(async (request, response) => {
    let body = ''; for await (const chunk of request) body += chunk;
    calls.push({ path: request.url, body: body ? JSON.parse(body) : null });
    response.setHeader('Content-Type', 'application/json');
    if (request.url.startsWith('/auth/v1/otp?')) return response.end('{}');
    if (request.url === '/auth/v1/token?grant_type=pkce') return response.end(JSON.stringify({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 3600 }));
    if (request.url === '/auth/v1/user') return response.end(JSON.stringify({ id: 'fixture-user', email_confirmed_at: '2026-09-06T00:00:00Z' }));
    if (request.url === '/rest/v1/rpc/gymaf_register_session') {
      response.statusCode = registrationFails ? 403 : 200;
      return response.end(registrationFails ? '{"code":"42501"}' : '{}');
    }
    if (request.url === '/rest/v1/rpc/gymaf_training_command') {
      response.statusCode = 400;
      return response.end('{"code":"GY409","message":"Favorite changed"}');
    }
    response.statusCode = 404; response.end('{}');
  });
  fixture.listen(0, '127.0.0.1'); await once(fixture, 'listening');
  const reservation = createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
  const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    windowsHide: true, stdio: 'ignore', env: { ...process.env, APP_ORIGIN: origin, SUPABASE_URL: `http://127.0.0.1:${fixture.address().port}`, SUPABASE_PUBLISHABLE_KEY: 'fixture-public', GYMAF_EMAIL_AUTH_MODE: 'link' },
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { ready = (await fetch(origin + '/login')).ok; } catch {}
      if (ready) break; await delay(100);
    }
    assert.equal(ready, true, 'isolated built app starts');
    const sent = await fetch(origin + '/api/v1/auth/request-link', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'synthetic@example.com' }) });
    assert.equal(sent.status, 200);
    const verifierCookie = sent.headers.getSetCookie()[0];
    assert.match(verifierCookie, /HttpOnly/i); assert.match(verifierCookie, /SameSite=lax/i); assert.match(verifierCookie, /Max-Age=3600/i);
    const cookie = verifierCookie.split(';')[0], verifier = cookie.split('=')[1];
    assert.equal(calls[0].body.code_challenge, createHash('sha256').update(verifier).digest('base64url'));
    assert.equal(calls[0].body.code_challenge_method, 's256');
    assert.equal(new URL(calls[0].path, origin).searchParams.get('redirect_to'), origin + '/auth/callback');
    assert.equal((await sent.text()).includes(verifier), false);

    const callback = origin + '/auth/callback?code=00000000-0000-0000-0000-000000000001&next=https://example.com';
    const signedIn = await fetch(callback, { headers: { cookie }, redirect: 'manual' });
    assert.equal(signedIn.status, 303); assert.equal(signedIn.headers.get('location'), origin + '/app');
    const cookies = signedIn.headers.getSetCookie();
    for (const name of ['gymaf-access', 'gymaf-refresh']) {
      const session = cookies.find(value => value.startsWith(name + '='));
      assert.match(session, /HttpOnly/i); assert.match(session, /SameSite=lax/i);
    }
    assert.match(cookies.find(value => value.startsWith('gymaf-pkce=')), /Max-Age=0/i);
    assert.deepEqual(calls.slice(1).map(call => call.path), ['/auth/v1/token?grant_type=pkce', '/auth/v1/user', '/rest/v1/rpc/gymaf_register_session']);
    assert.equal(calls[1].body.code_verifier, verifier);
    assert.equal(await signedIn.text(), '');
    const conflict = await fetch(origin + '/api/v1/commands', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', cookie: 'gymaf-access=fixture-access' }, body: JSON.stringify({ action: 'training.favorite', commandId: '81000000-0000-4000-8000-000000000001', payload: { scheduledId: '82000000-0000-4000-8000-000000000001', favorite: true, revision: 0 } }) });
    assert.equal(conflict.status, 409, 'application conflict is returned immediately as HTTP 409');
    assert.equal((await conflict.json()).error.code, 'CONFLICT');

    registrationFails = true;
    const denied = await fetch(callback, { headers: { cookie }, redirect: 'manual' });
    assert.equal(denied.headers.get('location'), origin + '/login?error=invalid-link');
    assert.equal(denied.headers.get('set-cookie'), null, 'failed registration never installs a session');
    const previousCalls = calls.length;
    const missing = await fetch(callback, { redirect: 'manual' });
    assert.equal(missing.headers.get('location'), origin + '/login?error=different-browser');
    assert.equal(calls.length, previousCalls, 'missing browser binding never contacts provider');
  } finally {
    child.kill(); await once(child, 'exit');
    await new Promise(resolve => fixture.close(resolve));
  }
});
