import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { dateOnly, monday, elapsedSeconds, validatePlan, validateCommand, uuid, InputError } from '../../src/shared/gymaf/validation.ts';

const plan = () => ({ workouts:[{ id:randomUUID(),title:'Synthetic plan',dayOffset:0,exercises:[{id:randomUUID(),name:'Reviewed test exercise',instructions:'Synthetic test content, not an exercise recommendation.',sets:[{reps:10,loadKg:null,durationSeconds:null,distanceM:null,restSeconds:60}]}]}] });
const cmd = (action,payload,commandId=randomUUID()) => ({ action,payload,commandId });

test('real calendar dates, not weekday labels, are required', () => {
  assert.equal(dateOnly('2028-02-29'),'2028-02-29');
  for (const bad of ['Monday','2026-02-29','2026-04-31','2026-13-01','2026-9-05']) assert.throws(() => dateOnly(bad),InputError);
});
test('week starts remain distinct across weeks and year boundaries', () => {
  assert.equal(monday('2026-09-05'),'2026-08-31');
  assert.equal(monday('2026-09-12'),'2026-09-07');
  assert.equal(monday('2027-01-01'),'2026-12-28');
});
test('timer is derived from acknowledged timestamps rather than counted interval callbacks', () => {
  const running = {elapsed_seconds:30,running_since:'2026-09-05T10:00:00Z'};
  assert.equal(elapsedSeconds(running,Date.parse('2026-09-05T10:02:00Z')),150);
  assert.equal(elapsedSeconds({...running,running_since:null},Date.parse('2026-09-06T10:02:00Z')),30);
  assert.equal(elapsedSeconds(running,Date.parse('2026-09-05T09:59:00Z')),30);
});
test('valid program plan retains nullable targets', () => {
  const p=plan(); assert.deepEqual(validatePlan(p),p);
  assert.equal(validatePlan(p).workouts[0].exercises[0].sets[0].loadKg,null);
});
test('plan rejects malformed nested state instead of calling map on null', () => {
  assert.throws(() => validatePlan({workouts:null}),InputError);
  const p=plan(); p.workouts[0].exercises=null;
  assert.throws(() => validatePlan(p),InputError);
});
test('plan IDs are unique and target numbers are finite', () => {
  const p=plan(); p.workouts[0].exercises[0].id=p.workouts[0].id;
  assert.throws(() => validatePlan(p),InputError);
  const q=plan(); q.workouts[0].exercises[0].sets[0].loadKg=Infinity;
  assert.throws(() => validatePlan(q),InputError);
});
test('a set requires a nonzero repetition, duration or distance target', () => {
  const p=plan(); p.workouts[0].exercises[0].sets[0].reps=null;
  assert.throws(() => validatePlan(p),InputError);
});
test('identifiers and extra authority fields are rejected', () => {
  assert.throws(() => uuid('../other-client'),InputError);
  assert.throws(() => validateCommand(cmd('session.start',{scheduledId:randomUUID(),clientUserId:randomUUID()})),InputError);
});
test('a retry retains its command ID; a genuine new attempt has a different ID', () => {
  const first=cmd('session.start',{scheduledId:randomUUID()});
  assert.deepEqual(validateCommand(first),validateCommand(structuredClone(first)));
  const repeat={...first,commandId:randomUUID()};
  assert.notEqual(validateCommand(first).commandId,validateCommand(repeat).commandId);
  // Durable deduplication/history is tested against PostgreSQL, not claimed by this input test.
});
test('actual zero and unknown are distinct; negative and fractional repetitions fail', () => {
  const payload={sessionId:randomUUID(),exerciseId:randomUUID(),setIndex:0,revision:0,actualReps:0,loadKg:null,durationSeconds:null,distanceM:null,skipped:false};
  assert.equal(validateCommand(cmd('session.save-set',payload)).payload.actualReps,0);
  assert.equal(validateCommand(cmd('session.save-set',payload)).payload.loadKg,null);
  assert.throws(() => validateCommand(cmd('session.save-set',{...payload,actualReps:-1})),InputError);
  assert.throws(() => validateCommand(cmd('session.save-set',{...payload,actualReps:1.5})),InputError);
});
test('check-in period starts on Monday and unknown commands fail closed', () => {
  assert.throws(() => validateCommand(cmd('checkin.submit',{relationshipId:randomUUID(),weekStart:'2026-09-05',difficulty:5,body:''})),InputError);
  assert.throws(() => validateCommand(cmd('grant-admin',{role:'operator'})),InputError);
});
test('entitlement end follows start and client cannot set an invented source', () => {
  const p={relationshipId:randomUUID(),startsAt:'2026-09-05T10:00:00Z',endsAt:'2026-09-04T10:00:00Z',source:'complimentary',reason:'Synthetic test'};
  assert.throws(() => validateCommand(cmd('entitlement.grant',p)),InputError);
  assert.throws(() => validateCommand(cmd('entitlement.grant',{...p,endsAt:'2026-10-05T10:00:00Z',source:'paid'})),InputError);
});
