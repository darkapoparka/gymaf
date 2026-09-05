import test from 'node:test';
import assert from 'node:assert/strict';
import { progressData, shiftDate } from '../../src/features/gymaf/progress-data.ts';

const session = (completed_at, elapsed_seconds = 600, state = 'completed') => ({ completed_at, started_at: completed_at, elapsed_seconds, state });
test('progress windows use completion dates in the client timezone and omit future or incomplete sessions', () => {
  const data = progressData([
    session('2026-09-05T22:30:00Z'), // September 6 in Sofia
    session('2026-09-06T06:00:00Z'),
    session('2026-09-06T07:00:00Z', 600, 'abandoned'),
    session('2026-08-07T10:00:00Z'), // outside the rolling window
    session('2026-09-07T10:00:00Z'),
  ], 'Europe/Sofia', '2026-09-06');
  assert.equal(data.start, '2026-08-08');
  assert.equal(data.recent.length, 2);
  assert.deepEqual([...data.active], ['2026-09-06']);
  assert.equal(data.week.at(-1).minutes, 20);
  assert.equal(data.week[0].day, '2026-08-31');
});
test('calendar covers every day in the window including six-row and year-boundary grids', () => {
  const data = progressData([], 'UTC', '2026-09-01');
  assert.equal(data.dates.length % 7, 0);
  assert.ok(data.dates.includes(data.start));
  assert.ok(data.dates.includes('2026-09-01'));
  assert.equal(new Date(data.dates[0] + 'T12:00:00Z').getUTCDay(), 1);
  assert.equal(shiftDate('2028-03-01', -1), '2028-02-29');
  assert.equal(shiftDate('2027-01-01', -1), '2026-12-31');
});
