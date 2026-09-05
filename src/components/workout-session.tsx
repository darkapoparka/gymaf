"use client";
import { useCaptureState } from "@/lib/capture-context";
import { useEffect } from "react";
import { useAppRouter as useRouter } from "./capture-link";
import {
  Check,
  ChevronRight,
  Dumbbell,
  Flag,
  History,
  Layers,
  List,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Video,
  Volume2,
} from "lucide-react";
import { type Workout } from "@/lib/data";
import { useLocalData } from "@/lib/store";
import { Avatar, IconButton, Photo, Row, Sheet, Tabs } from "./primitives";
import { Chips } from "./flow-primitives";

export const flagReasons = [
  "Dislike",
  "Too Hard",
  "Too Easy",
  "Uncomfortable",
  "Mix It Up",
  "Missing Equipment",
  "Traveling",
  "Equipment Busy",
  "Injured",
  "Equipment Issue",
];
export function exerciseNames(w: Workout) {
  return w.category === "Flexibility"
    ? [
        "Downward Dog",
        "Standing Forward Fold",
        "Mountain Pose Breathing",
        "Standing Forward Fold",
        "Chaturanga",
        "Cat-Cow",
        "Downward Dog",
        "Half Forward Fold",
        "Standing Forward Fold",
        "Mountain Pose Breathing",
      ]
    : [
        "Quadruped Kick-Back · Left Leg",
        "Quadruped Kick-Back · Right Leg",
        "Quadruped Fire Hydrant Circles Backwards · Left Leg",
        "Quadruped Fire Hydrant Circles Backwards · Right Leg",
        "Bodyweight Squat",
        "Push Up",
        "Glute Bridge",
        "Low Plank",
      ];
}
export function WorkoutSession({
  workout: w,
  screen,
}: {
  workout: Workout;
  screen?: string;
}) {
  const router = useRouter();
  const { data, update } = useLocalData();
  const saved = JSON.parse(data.preferences.activeSession || "null") as {
    id: string;
    elapsed: number;
    step: number;
  } | null;
  const [elapsed, setElapsed] = useCaptureState("session.elapsed", 
      saved?.id === w.id ? saved.elapsed : 0,
    ),
    [step, setStep] = useCaptureState("session.step", saved?.id === w.id ? saved.step : 0);
  const [paused, setPaused] = useCaptureState("session.paused", screen === "pause"),
    [replaced, setReplaced] = useCaptureState("session.replaced", false),
    [expanded, setExpanded] = useCaptureState("session.expanded", screen !== "collapsed");
  const screenNames: Record<string, string> = {
    overview: "Workout Overview",
    reps: "Adjust Reps",
    flag: "Flag Exercise",
    swap: "Swap Exercise",
    history: "Exercise History",
    music: "Music",
    finish: "End Workout",
  };
  const [sheet, setSheet] = useCaptureState<string | null>("session.sheet", 
    screen ? screenNames[screen] || null : null,
  );
  const [reps, setReps] = useCaptureState("session.reps", "15"),
    [comment, setComment] = useCaptureState("session.comment", ""),
    [historyRange, setHistoryRange] = useCaptureState("session.historyRange", "30 Days"),
    [reasons, setReasons] = useCaptureState<string[]>("session.reasons", []);
  const [guide, setGuide] = useCaptureState("session.guide", 
      data.preferences.exerciseInstructions !== "Never",
    ),
    [movementStart, setMovementStart] = useCaptureState("session.movementStart", 0);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [paused, setElapsed]);
  const running = w.category === "Running" || w.category === "Activity",
    exercises = exerciseNames(w),
    exercise = replaced
      ? "Modified Plyo Push-Up"
      : exercises[step % exercises.length];
  const time = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  function finish() {
    update((s) => ({
      completed: [...new Set([...s.completed, w.id])],
      sessions: { ...s.sessions, [w.id]: { seconds: elapsed, reps } },
      preferences: {
        ...s.preferences,
        activeSession: "",
        homeState: "completed",
      },
    }));
    router.push(`/workouts/${w.id}/summary`);
  }
  function saveFlag() {
    update((s) => ({
      preferences: {
        ...s.preferences,
        ["flag:" + w.id]: JSON.stringify({ exercise, reasons, comment }),
      },
    }));
    setSheet("Swap Exercise");
  }
  function advance() {
    if (step >= exercises.length - 1) {
      setSheet("End Workout");
      return;
    }
    setStep((s) => s + 1);
    setMovementStart(elapsed);
    setReplaced(false);
  }
  function record() {
    update((s) => ({
      preferences: {
        ...s.preferences,
        activeSession: JSON.stringify({ id: w.id, elapsed, step }),
      },
    }));
    router.push(`/workouts/${w.id}/record`);
  }
  return (
    <div className={"session " + (running ? "running-session" : "")}>
      {!running && (
        <div className="workout-backdrop">
          <Photo
            crop={
              w.category === "Flexibility"
                ? {
                    src: "screens/db68d717b839be9c.webp",
                    sw: 1180,
                    sh: 2676,
                    x: 0,
                    y: 390,
                    w: 1180,
                    h: 1020,
                  }
                : w.image
            }
            alt={w.title}
            priority
          />
        </div>
      )}
      <header className="session-top">
        <IconButton label="Music" onClick={() => setSheet("Music")}>
          <Music2 />
        </IconButton>
        <div>
          {!running && (
            <div className="progress-track">
              <span
                style={{
                  width: `${Math.min(100, (elapsed / (w.minutes * 60)) * 100)}%`,
                }}
              />
            </div>
          )}
          <b>{time}</b>
          {!running && (
            <span>
              {Math.max(0, w.minutes - Math.floor(elapsed / 60))} min left
            </span>
          )}
        </div>
        <IconButton
          label={paused ? "Resume workout" : "Pause workout"}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play /> : <Pause />}
        </IconButton>
      </header>
      {running ? (
        <>
          <div className="running-data">
            <label>ELAPSED</label>
            <strong>
              {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
              {String(elapsed % 60).padStart(2, "0")}.000
            </strong>
            <label>MILES</label>
            <div className="miles">0</div>
            <div className="pace-grid">
              {[
                ["PACE", "0′00″"],
                ["PROJ SPLIT", "–"],
                ["AVG PACE", "0′00″"],
                ["BEST SPLIT", "–"],
              ].map(([label, value]) => (
                <div key={label}>
                  <label>{label}</label>
                  <span>{value}</span>
                </div>
              ))}
            </div>
            <p className="note">
              Distance tracking requires a connected device.
            </p>
          </div>
          <footer className="run-footer">
            <span>{w.title}</span>
            <button onClick={() => setSheet("End Workout")}>
              End <Check />
            </button>
          </footer>
        </>
      ) : (
        <section className={"exercise-panel " + (!expanded ? "collapsed" : "")}>
          <button
            className="drag-handle"
            aria-label={
              expanded
                ? "Collapse exercise controls"
                : "Expand exercise controls"
            }
            onClick={() => setExpanded(!expanded)}
          />
          {w.category !== "Flexibility" && <div className="floating-coach"><Avatar size={52} /></div>}
          {replaced && (
            <div className="replacement-notice">
              Modified Plyo Push-Up from Chaturanga{" "}
              <button onClick={() => setReplaced(false)}>Undo</button>
            </div>
          )}
          <h2>{exercise}</h2>
          <div className="exercise-timer">
            <IconButton
              label="Exercise list"
              onClick={() => setSheet("Workout Overview")}
            >
              <List />
            </IconButton>
            <strong>
              :{String(30 - ((elapsed - movementStart) % 30)).padStart(2, "0")}
            </strong>
            <IconButton label="Next exercise" onClick={advance}>
              <ChevronRight />
            </IconButton>
          </div>
          <div className="progress-track exercise-progress">
            <span
              style={{
                width: `${(((elapsed - movementStart) % 30) / 30) * 100}%`,
              }}
            />
          </div>
          {expanded && (
            <div className="exercise-actions">
              <button disabled>
                <Dumbbell />
                Weight
              </button>
              <button onClick={() => setSheet("Adjust Reps")}>
                <Layers />
                Reps
              </button>
              <button onClick={record}>
                <Video />
                Record
              </button>
              <button onClick={() => setSheet("Flag Exercise")}>
                <Flag />
                Flag
              </button>
              <button aria-pressed={guide} onClick={() => setGuide(!guide)}>
                <Volume2 />
                {guide ? "Guide" : "Guide Off"}
              </button>
              <button onClick={() => setSheet("Exercise History")}>
                <History />
                History
              </button>
              <button onClick={() => setMovementStart(elapsed)}>
                <RotateCcw />
                Restart
              </button>
            </div>
          )}
        </section>
      )}
      {paused && (
        <div className="pause-overlay">
          <h1>Workout Paused</h1>
          <button className="button" onClick={() => setPaused(false)}>
            <Play />
            Resume
          </button>
          <button className="button" onClick={() => setSheet("End Workout")}>
            End Workout
          </button>
        </div>
      )}
      {sheet && (
        <Sheet
          title={
            sheet === "Flag Exercise"
              ? "Flag"
              : sheet === "Swap Exercise"
                ? "Swap"
                : sheet === "Workout Overview"
                  ? "Overview"
                  : sheet
          }
          onClose={() => setSheet(null)}
        >
          {sheet === "End Workout" ? (
            <>
              <h2>Finish your workout?</h2>
              <button className="button primary full" onClick={finish}>
                Yes, Finish Workout
              </button>
              <button className="button full" onClick={() => setSheet(null)}>
                Cancel
              </button>
            </>
          ) : sheet === "Adjust Reps" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSheet(null);
              }}
            >
              <h2>{exercise}</h2>
              <label className="form-field">
                Reps
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  required
                />
              </label>
              <p className="note">30 sec</p>
              <button className="button primary full">Update</button>
            </form>
          ) : sheet === "Workout Overview" ? (
            <>
              <h3>Workout Intro</h3>
              <h2>
                {w.category === "Flexibility"
                  ? "Primary Flow – Prep for Peak"
                  : "Warm-up"}
                <small> · {w.category === "Flexibility" ? 6 : 5} min</small>
              </h2>
              <div className="row-group">
                {exercises.map((e, i) => (
                  <Row
                    key={e + i}
                    detail=":30"
                    onClick={() => {
                      setStep(i);
                      setSheet(null);
                      setMovementStart(elapsed);
                    }}
                  >
                    {e}
                  </Row>
                ))}
              </div>
              <button
                className="button full"
                onClick={() => setSheet("End Workout")}
              >
                End Workout
              </button>
            </>
          ) : sheet === "Flag Exercise" ? (
            <>
              <h2>{exercise}</h2>
              <Chips
                items={flagReasons}
                selected={reasons}
                onChange={(v) =>
                  setReasons((s) =>
                    s.includes(v) ? s.filter((x) => x !== v) : [...s, v],
                  )
                }
              />
              <label className="form-field">
                Comments for Lee (optional)
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>
              <button className="button primary full" onClick={saveFlag}>
                NEXT
              </button>
              <button
                className="button full"
                onClick={() => {
                  setReasons([]);
                  setComment("");
                  update((s) => ({
                    preferences: { ...s.preferences, ["flag:" + w.id]: "" },
                  }));
                  setSheet(null);
                }}
              >
                REMOVE FLAG
              </button>
            </>
          ) : sheet === "Swap Exercise" ? (
            <>
              <h2>{exercise}</h2>
              <div className="swap-photo">
                <Photo crop={w.image} />
              </div>
              <h2>Modified Plyo Push-Up</h2>
              <p>No Equipment Needed</p>
              <button
                className="button primary full"
                onClick={() => {
                  setReplaced(true);
                  setSheet(null);
                }}
              >
                REPLACE EXERCISE
              </button>
              <button className="button full" onClick={() => setSheet(null)}>
                NOT NOW
              </button>
            </>
          ) : sheet === "Exercise History" ? (
            <>
              <h2>{exercise}</h2>
              <Tabs
                items={["30 Days", "90 Days", "All"]}
                value={historyRange}
                onChange={setHistoryRange}
              />
              <h3>Today</h3>
              <Row detail="00:30">Primary Flow – Prep for Peak</Row>
            </>
          ) : (
            <div className="empty-state">
              <Music2 size={48} />
              <h2>Music Currently Unavailable</h2>
              <p>Only available in the U.S.</p>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}
