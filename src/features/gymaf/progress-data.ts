import type { WorkoutSession } from '../../shared/gymaf/contracts';

export function shiftDate(day: string, offset: number) {
  const value = new Date(day + 'T12:00:00Z');
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

/** Calendar windows use the client's timezone, never the browser's timezone. */
export function progressData(sessions: WorkoutSession[], timezone: string, today: string) {
  const dateOf = (session: WorkoutSession) => new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(session.completed_at || session.started_at));
  const done = sessions.filter(session => session.state === 'completed');
  const start = shiftDate(today, -29);
  const recent = done.filter(session => dateOf(session) >= start && dateOf(session) <= today);
  const first = new Date(start + 'T12:00:00Z');
  const gridStart = shiftDate(start, -(first.getUTCDay() + 6) % 7);
  const gridLength = Math.ceil((Math.round((Date.parse(today) - Date.parse(gridStart)) / 86400000) + 1) / 7) * 7;
  return {
    done, recent, start, dateOf,
    active: new Set(recent.map(dateOf)),
    dates: Array.from({ length: gridLength }, (_, i) => shiftDate(gridStart, i)),
    week: Array.from({ length: 7 }, (_, i) => {
      const day = shiftDate(today, i - 6);
      return { day, minutes: done.filter(session => dateOf(session) === day).reduce((n, s) => n + s.elapsed_seconds / 60, 0) };
    }),
  };
}
