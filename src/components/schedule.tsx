"use client";
import { useCaptureState } from "@/lib/capture-context";
import Link from "./capture-link";
import { useAppRouter as useRouter } from "./capture-link";
import { ArrowDown, ArrowUp, Plus, Search } from "lucide-react";
import { workouts } from "@/lib/data";
import { useLocalData } from "@/lib/store";
import { PageHead, Row, Sheet } from "./primitives";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export function ScheduleScreen() {
  const { data, update } = useLocalData();
  const router = useRouter();
  const [sheet, setSheet] = useCaptureState<string | null>("schedule.sheet", null),
    [day, setDay] = useCaptureState("schedule.day", "Thursday"),
    [selection, setSelection] = useCaptureState("schedule.selection", "running"),
    [duration, setDuration] = useCaptureState("schedule.duration", "45"),
    [search, setSearch] = useCaptureState("schedule.search", ""),
    [reason, setReason] = useCaptureState("schedule.reason", ""),
    [dragged, setDragged] = useCaptureState<string | null>("schedule.dragged", null);
  function move(from: string, to: string) {
    if (from === to) return;
    update((s) => ({
      schedule: {
        ...s.schedule,
        [to]: s.schedule[from] || "",
        [from]: s.schedule[to] || "",
      },
      preferences: { ...s.preferences, ["scheduleDuration:" + to]: s.preferences["scheduleDuration:" + from] || "", ["scheduleDuration:" + from]: s.preferences["scheduleDuration:" + to] || "" },
    }));
  }
  return (
    <>
      <PageHead title="Edit Schedule" back="/" />
      <div className="schedule">
        {days.map((d, i) => {
          const w = workouts.find((w) => w.id === data.schedule[d]);
          return (
            <div
              key={d}
              className="schedule-day"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragged) move(dragged, d);
                setDragged(null);
              }}
            >
              <div>
                <b>{d[0]}</b>
                <span>{[29, 30, 1, 2, 3, 4, 5][i]}</span>
              </div>
              <div>
                {w ? (
                  <div draggable onDragStart={() => setDragged(d)}>
                    <Link href={`/workouts/${w.id}`}>{w.title}</Link>
                    <small>
                      {data.preferences["scheduleDuration:" + d] || w.minutes}{" "}
                      min
                    </small>
                    <div className="schedule-actions">
                      <button
                        aria-label={`Move ${d} workout earlier`}
                        disabled={!i}
                        onClick={() => move(d, days[i - 1])}
                      >
                        <ArrowUp size={17} />
                      </button>
                      <button
                        aria-label={`Move ${d} workout later`}
                        disabled={i === 6}
                        onClick={() => move(d, days[i + 1])}
                      >
                        <ArrowDown size={17} />
                      </button>
                      <button
                        onClick={() =>
                          update((s) => ({
                            schedule: { ...s.schedule, [d]: "" },
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : i === 0 || i === 2 ? (
                  <>
                    <span>Rest Day</span>
                    <button
                      className="text-button"
                      onClick={() => {
                        setDay(d);
                        setSheet("Just Work Out");
                      }}
                    >
                      Add Workout
                    </button>
                  </>
                ) : (
                  <button
                    className="button"
                    onClick={() => {
                      setDay(d);
                      setSheet("Just Work Out");
                    }}
                  >
                    <Plus size={16} />
                    Add Workout
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button
        className="button primary full"
        onClick={() => setSheet("Reason for schedule change")}
      >
        Done
      </button>
      {sheet && (
        <Sheet title={sheet} onClose={() => setSheet(null)}>
          {sheet === "Just Work Out" ? (
            <>
              <label className="search-field">
                <Search size={18} />
                <input
                  placeholder="Search Activities"
                  aria-label="Search activities"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <h2>Most Recent</h2>
              <div className="row-group">
                {workouts
                  .filter((w) =>
                    w.title.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((w) => (
                    <Row
                      key={w.id}
                      onClick={() => setSelection(w.id)}
                      detail={selection === w.id ? "Selected" : ""}
                    >
                      {w.title}
                    </Row>
                  ))}
              </div>
              <div className="schedule-picker">
                <h2>{workouts.find((w) => w.id === selection)?.title}</h2>
                <label className="form-field">
                  Day
                  <select value={day} onChange={(e) => setDay(e.target.value)}>
                    {days.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  Duration
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  >
                    {[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90].map(
                      (n) => (
                        <option key={n} value={n}>
                          {n} min
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <button
                  className="button primary full"
                  onClick={() => {
                    update((s) => ({
                      schedule: { ...s.schedule, [day]: selection },
                      preferences: {
                        ...s.preferences,
                        ["scheduleDuration:" + day]: duration,
                      },
                    }));
                    setSheet(null);
                  }}
                >
                  Add Workout
                </button>
              </div>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update((s) => ({
                  preferences: { ...s.preferences, scheduleReason: reason },
                }));
                router.push("/");
              }}
            >
              <label className="form-field">
                Comments for Lee
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button className="button primary full">Done</button>
              <button
                type="button"
                className="button full"
                onClick={() => setSheet(null)}
              >
                Cancel
              </button>
            </form>
          )}
        </Sheet>
      )}
    </>
  );
}
