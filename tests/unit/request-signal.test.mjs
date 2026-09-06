import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { requestSignal } from '../../src/features/gymaf/request-signal.ts';
test('a caller controller preserves both timeout recovery and navigation cancellation',async()=>{
  const parent=new AbortController(),timed=requestSignal(parent.signal,10);
  await delay(25);assert.equal(parent.signal.aborted,false);assert.equal(timed.aborted,true);assert.equal(timed.reason.name,'TimeoutError');
  const next=requestSignal(parent.signal,1000);parent.abort();assert.equal(next.aborted,true);assert.equal(next.reason.name,'AbortError');
  assert.equal(requestSignal(parent.signal,1000).aborted,true);
});
