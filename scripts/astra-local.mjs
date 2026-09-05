import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function localConfig() {
  let status;
  try {
    const output = process.platform === 'win32'
      ? execFileSync('cmd.exe', ['/d','/s','/c','npx supabase status -o json'], { encoding:'utf8', stdio:['ignore','pipe','pipe'] })
      : execFileSync('npx', ['supabase','status','-o','json'], { encoding:'utf8', stdio:['ignore','pipe','pipe'] });
    status = JSON.parse(output);
  } catch { throw new Error('Start the local Supabase stack first: npx supabase start. No remote fallback is allowed.'); }
  const url = status.API_URL, key = status.ANON_KEY || status.PUBLISHABLE_KEY, admin = status.SERVICE_ROLE_KEY || status.SECRET_KEY;
  if (!url || !key || !admin || !['127.0.0.1','localhost','[::1]'].includes(new URL(url).hostname)) throw new Error('Refusing to seed a non-local or incomplete Supabase configuration.');
  return { url, key, admin };
}
export async function localRequest(c, path, body, token, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(c.url + path, { method, headers:{ apikey:c.key, Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, ...(body === undefined ? {} : { body:JSON.stringify(body) }), signal:AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => null);
  if (!response.ok) { const error = new Error(`Local ${method} request failed (${response.status}, ${data?.code || 'unknown'}). No credentials or response bodies logged.`); error.status=response.status; error.code=data?.code; throw error; }
  return data;
}
export async function seedLocal() {
  const c = localConfig();
  const existing = await localRequest(c, '/auth/v1/admin/users?page=1&per_page=1000', undefined, c.admin);
  const actors = {};
  const names = { coach_a:'coach-a', coach_b:'coach-b', client_a1:'client-a1', client_a2:'client-a2', client_b1:'client-b1', operator_user:'operator' };
  for (const [role,name] of Object.entries(names)) {
    const email = `${name}@gymaf.example`;
    let user = (existing.users || []).find(u => u.email === email);
    if (!user) user = await localRequest(c, '/auth/v1/admin/users', { email, email_confirm:true, password:randomBytes(32).toString('base64url') }, c.admin);
    const id = user.id || user.user?.id;
    if (!id) throw new Error('Local user creation did not return an ID.');
    // Admin-generated one-time code avoids storing passwords or session tokens on disk.
    const link = await localRequest(c, '/auth/v1/admin/generate_link', { type:'magiclink', email }, c.admin);
    const otp = link.email_otp || link.properties?.email_otp;
    if (!otp) throw new Error('Local Auth did not return an email OTP.');
    const session = await localRequest(c, '/auth/v1/verify', { type:'email', email, token:otp }, c.key);
    actors[role] = { id,email,token:session.access_token };
  }
  const ids = Object.fromEntries(Object.entries(actors).map(([key,value]) => [key,value.id]));
  const seed = await localRequest(c, '/rest/v1/rpc/gymaf_seed_synthetic', ids, c.admin);
  for (const actor of Object.values(actors)) await localRequest(c, '/rest/v1/rpc/gymaf_register_session', {}, actor.token);
  return { config:c, actors, seed };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { config,actors,seed } = await seedLocal();
    if (!existsSync('.env.local')) writeFileSync('.env.local', `APP_ORIGIN=http://127.0.0.1:3210\nSUPABASE_URL=${config.url}\nSUPABASE_PUBLISHABLE_KEY=${config.key}\nGYMAF_REFERENCE_PREVIEW=0\n`, { mode:0o600 });
    console.log('Local synthetic accounts ready. Sign in using an email code at /login; view codes at http://127.0.0.1:54324.');
    console.log(JSON.stringify({ accounts:Object.fromEntries(Object.entries(actors).map(([role,a])=>[role,{id:a.id,email:a.email}])), ...seed }, null, 2));
    console.log('Existing .env.local files are never overwritten. This seed is not a production launch or privacy approval.');
  } catch (error) { console.error(error.message); process.exitCode=1; }
}
