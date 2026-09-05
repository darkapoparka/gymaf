"use client";
import { useCaptureState } from "@/lib/capture-context";
import Link from "./capture-link";
import {
  CalendarDays,
  ChevronRight,
  Footprints,
  Plus,
  Check,
} from "lucide-react";
import { useLocalData } from "@/lib/store";
import { PageHead, Rings, Row, Sheet, Tabs } from "./primitives";

export function ProgressScreen() {
  const { data, update } = useLocalData();
  const [tab, setTab] = useCaptureState("progress.tab", "Goals");
  const [goalOpen, setGoalOpen] = useCaptureState("progress.goalOpen", false);
  const [day, setDay] = useCaptureState<number | null>("progress.day", null);
  const [goal, setGoal] = useCaptureState("progress.goal", data.goal);
  const metrics: string[] = JSON.parse(
    data.preferences.metrics ||
      '["Activity Rings","Minutes of Activity","Daily Steps"]',
  );
  return (
    <>
      <PageHead title="Progress" />
      <Tabs items={["Goals", "Metrics"]} value={tab} onChange={setTab} />
      {tab === "Goals" ? (
        <div className="progress-layout">
          <section>
            <h2>My Goal</h2>
            <div className="goal-card">{data.goal}</div>
            <button className="button" onClick={() => setGoalOpen(true)}>
              Change Goal
            </button>
            <h2>Workout Consistency</h2>
            <article className="consistency">
              <Link href="/progress/consistency" className="consistency-header">
                <CalendarDays color="#82cf48" size={20} />
                <span>Past 30 Days</span>
                <ChevronRight size={20} />
              </Link>
              <div className="calendar-grid">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <small key={i}>{d}</small>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const value = i < 30 ? i + 1 : i - 29;
                  return (
                    <button
                      key={i}
                      className={
                        (i === 3 || i === 29 ? "active-day " : "") +
                        (i > 29 ? "outside" : "")
                      }
                      aria-label={`View June ${value} workouts`}
                      onClick={() => setDay(value)}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
              <div className="calendar-stats">
                <span>
                  <small>Active Days</small>
                  <b>{2 + data.completed.length} days</b>
                </span>
                <span>
                  <small>Target</small>
                  <b>3 workouts/wk</b>
                </span>
              </div>
            </article>
          </section>
          <section className="progress-secondary">
            <h2>All Time</h2>
            <article className="all-time">
              <CalendarDays color="#82cf48" />
              <div className="bar-chart">
                <span style={{ height: 100 + data.completed.length * 15 }} />
                <small>Jun</small>
              </div>
              <div className="calendar-stats">
                <span>
                  <small>Member since</small>
                  <b>Jun 2026</b>
                </span>
                <span>
                  <small>Total Workouts</small>
                  <b>{3 + data.completed.length}</b>
                </span>
              </div>
            </article>
          </section>
        </div>
      ) : (
        <>
          <Link className="text-button metrics-edit" href="/progress/metrics">
            Edit
          </Link>
          <div className="metrics-grid">
            {metrics.map((m) => {
              const href =
                m === "Activity Rings"
                  ? "/progress/activity"
                  : m === "Daily Steps"
                    ? "/progress/steps"
                    : m === "Weight"
                      ? "/progress/weight"
                      : m === "Progress Photos"
                        ? "/progress/photos"
                        : "/progress/metric?activity=" + encodeURIComponent(m);
              return (
                <Link className="metric-card" key={m} href={href}>
                  <h2>
                    {m}
                    <ChevronRight size={20} />
                  </h2>
                  {m === "Activity Rings" ? (
                    <Rings size={110} active />
                  ) : (
                    <strong>
                      {m === "Weight"
                        ? data.weight || "�"
                        : m === "Minutes of Activity"
                          ? 18 +
                            Math.floor(
                              Object.values(data.sessions).reduce(
                                (a, v) => a + v.seconds,
                                0,
                              ) / 60,
                            )
                          : m === "Progress Photos"
                            ? data.photos.filter((p) => p.kind !== "message")
                                .length
                            : "�"}
                    </strong>
                  )}
                  <p>
                    {m === "Weight"
                      ? data.preferences.weightUnit || "lbs"
                      : m === "Minutes of Activity"
                        ? "minutes"
                        : "Today"}
                  </p>
                </Link>
              );
            })}
          </div>
          <Link className="button full" href="/progress/add-metric">
            Add Metrics
          </Link>
        </>
      )}
      {goalOpen && (
        <Sheet title="Change Goal" onClose={() => setGoalOpen(false)}>
          <div className="choice-list">
            {[
              "Lose Weight",
              "Get Toned",
              "Increase Muscle Mass",
              "Improve Health and Longevity",
              "Improve as an Athlete or Competitor",
            ].map((g) => (
              <button
                className="row"
                key={g}
                onClick={() => {
                  setGoal(g);
                }}
              >
                {g}
                {goal === g && <Check size={20} />}
              </button>
            ))}
          </div>
          <button
            className="button primary full"
            onClick={() => {
              update({ goal });
              setGoalOpen(false);
            }}
          >
            Update Goal
          </button>
        </Sheet>
      )}
      {day !== null && (
        <Sheet title={"June " + day} onClose={() => setDay(null)}>
          {day === 4 || day === 30 ? (
            <Row
              href="/workouts/morning-yoga/summary"
              detail="18:51 · Flexibility"
            >
              Morning Yoga Flow
            </Row>
          ) : (
            <div className="empty-state">
              <p>No workout recorded for this day.</p>
              <Link className="button" href="/workouts">
                Find a Workout
              </Link>
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}
export function ActivityScreen() {
  return (
    <>
      <PageHead title="Activity Rings" back="/progress" />
      <div className="rings-grid">
        {["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Today"].map(
          (d, i) => (
            <div key={d}>
              <small>{d}</small>
              <Rings size={58} active={i === 7} />
            </div>
          ),
        )}
      </div>
      <table className="activity-table">
        <thead>
          <tr>
            <th aria-label="Activity" />
            <th>Date</th>
            <th>Move</th>
            <th>Activity</th>
            <th>Stand</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 14 }, (_, i) => (
            <tr key={i}>
              <td>
                <Rings size={25} active={i === 0} />
              </td>
              <td>Jun {30 - i}, 2026</td>
              <td>–</td>
              <td>{i === 0 ? "18 min" : "–"}</td>
              <td>–</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
export function MeasurementScreen({
  weight = false,
  metric,
}: {
  weight?: boolean;
  metric?: string;
}) {
  const { data } = useLocalData();
  const [period, setPeriod] = useCaptureState("progress.period", "Month");
  const title = metric || (weight ? "Weight" : "Daily Steps");
  return (
    <>
      <PageHead title={title} back="/progress" />
      <Tabs
        items={["Week", "Month", "Year", "All"]}
        value={period}
        onChange={setPeriod}
      />
      {weight ? (
        <>
          <div className="weight-chart">
            <svg
              viewBox="0 0 330 190"
              role="img"
              aria-label="Logged weight trend"
            >
              <path d="M20 20V165H320" fill="none" stroke="#ccc" />
              {data.weightHistory.length > 0 && (
                <polyline
                  points={data.weightHistory
                    .map(
                      (w, i) =>
                        `${25 + i * (285 / Math.max(1, data.weightHistory.length - 1))},${155 - ((Number(w.value) - Math.min(...data.weightHistory.map((h) => Number(h.value)))) * 100) / Math.max(1, Math.max(...data.weightHistory.map((h) => Number(h.value))) - Math.min(...data.weightHistory.map((h) => Number(h.value))))}`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke="#818594"
                  strokeWidth="3"
                />
              )}
            </svg>
          </div>
          <div className="row-group">
            <Row
              detail={`${data.weight || "�"} ${data.preferences.weightUnit || "lbs"}`}
            >
              Most Recent
            </Row>
            <Row
              href="/progress/target"
              detail={data.preferences.targetWeight || "Add"}
            >
              Target Weight
            </Row>
          </div>
          <Link href="/progress/log-weight" className="button primary full">
            <Plus size={18} />
            Log Weight
          </Link>
          <div className="row-group">
            {[...data.weightHistory].reverse().map((w) => (
              <Row key={w.id} detail={w.date}>
                {w.value} {data.preferences.weightUnit || "lbs"}
              </Row>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="empty-state">
            <Footprints size={45} />
            <h2>No {title.toLowerCase()} data yet</h2>
            <p>Connect a compatible activity source to see your history.</p>
          </div>
          <div className="row-group">
            <Row detail="�">Average</Row>
            <Row detail="�">Most Recent</Row>
            <Row href="/settings/permissions">Data Sources</Row>
          </div>
        </>
      )}
    </>
  );
}
