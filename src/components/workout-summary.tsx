"use client";
import { useCaptureState } from "@/lib/capture-context";
import { useRef } from "react";
import Image from "next/image";
import Link from "./capture-link";
import {
  X,
  Ellipsis,
  Camera,
  Share2,
  Star,
} from "lucide-react";
import { type Workout } from "@/lib/data";
import { useLocalData } from "@/lib/store";
import { photoData } from "@/lib/media-store";
import { Avatar, Row, Sheet } from "./primitives";
import { Chips } from "./flow-primitives";
import { exerciseNames, flagReasons } from "./workout-session";

export function SummaryScreen({
  workout: w,
  screen,
}: {
  workout: Workout;
  screen?: string;
}) {
  const { data, update } = useLocalData();
  const [tab, setTab] = useCaptureState("summary.tab", 
    screen === "feedback"
      ? "Feedback"
      : screen === "exercises"
        ? "Exercises"
        : screen === "distance"
          ? "Distance"
          : "Summary",
  );
  const [rating, setRating] = useCaptureState("summary.rating", data.feedback[w.id]?.rating || 0),
    [text, setText] = useCaptureState("summary.text", data.feedback[w.id]?.text || ""),
    [tough, setTough] = useCaptureState("summary.tough", data.preferences["tough:" + w.id] || "3"),
    [template, setTemplate] = useCaptureState("summary.template", 0),
    [notice, setNotice] = useCaptureState("summary.notice", "");
  const [sheet, setSheet] = useCaptureState<string | null>("summary.sheet", 
      screen === "background"
        ? "Choose Background"
        : screen === "share"
          ? "Share to"
          : null,
    ),
    [editFlag, setEditFlag] = useCaptureState("summary.editFlag", false),
    [capture, setCapture] = useCaptureState("summary.capture", false);
  const input = useRef<HTMLInputElement>(null);
  const reference = w.id === "morning-yoga" && !data.completed.includes(w.id),
    session = data.sessions[w.id],
    done = data.completed.includes(w.id);
  const duration = reference
    ? "18:51"
    : session
      ? `${Math.floor(session.seconds / 60)}:${String(session.seconds % 60).padStart(2, "0")}`
      : w.minutes + " min";
  const background = data.preferences["summaryPhoto:" + w.id];
  const flag = JSON.parse(data.preferences["flag:" + w.id] || "null") as {
    exercise: string;
    reasons: string[];
    comment: string;
  } | null;
  function changeFlag(values: Partial<NonNullable<typeof flag>>) {
    if (flag)
      update((s) => ({
        preferences: {
          ...s.preferences,
          ["flag:" + w.id]: JSON.stringify({ ...flag, ...values }),
        },
      }));
  }
  async function upload(file?: File) {
    if (!file) return;
    try {
      const src = await photoData(file);
      update((s) => ({
        preferences: { ...s.preferences, ["summaryPhoto:" + w.id]: src },
      }));
      setSheet(null);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Photo unavailable.");
    }
  }
  async function copy(guest = false) {
    try {
      await navigator.clipboard.writeText(
        window.location.origin +
          (guest ? "/friends/invite" : `/workouts/${w.id}/summary`),
      );
      setNotice("Link Copied");
    } catch {
      setNotice("Copy the page address from your browser.");
    }
  }
  const card = (variant: number) => (
    <article className={"summary-card template-" + variant}>
      {background && (
        <Image
          src={background}
          alt="Your workout background"
          fill
          unoptimized
          className="summary-background"
        />
      )}
      <div>
        <Image src="/brand/emblem.svg" width={18} height={24} alt="Future" className="future-symbol" />
        <Avatar size={25} />
        Coach Lee
      </div>
      <section>
        {variant !== 2 && (
          <>
            <strong>{reference ? "50" : done ? "✓" : "—"}</strong>
            <small>
              {reference
                ? "Est. Calorie Burn"
                : done
                  ? "Workout completed"
                  : "Not completed"}
            </small>
          </>
        )}
        <strong>{duration}</strong>
        <small>{reference || done ? "Duration" : "Planned duration"}</small>
      </section>
      <aside>{w.title}<span>{reference ? "JUN 30, 2026" : "WORKOUT SUMMARY"}</span></aside>
    </article>
  );
  return (
    <>
      <header className="summary-head">
        <Link href="/" className="icon-button" aria-label="Close"><X /></Link>
        <h2>
          {reference
            ? "Today • 11:23 AM"
            : done
              ? "Workout Complete"
              : "Workout Summary"}
        </h2>
        <button className="icon-button" aria-label="Workout options" onClick={() => setSheet("Workout options")}><Ellipsis /></button>
      </header>
      <div className="tabs summary-tabs" role="tablist" aria-label="Workout summary">
        {(w.category === "Running" || w.category === "Activity" ? ["Summary", "Distance"] : ["Summary", "Feedback", "Exercises"]).map(item => <button role="tab" aria-selected={tab === item} className={tab === item ? "selected" : ""} key={item} onClick={() => setTab(item)}>{item}{item === "Exercises" && <span className="count">{exerciseNames(w).length}</span>}</button>)}
      </div>
      {tab === "Summary" ? (
        <>
          <div className="summary-carousel" aria-label="Workout share templates" tabIndex={0} onScroll={e => {
            const element = e.currentTarget;
            const width = element.firstElementChild?.getBoundingClientRect().width ?? 292;
            setTemplate(Math.min(2, Math.round(element.scrollLeft / (width + 10))));
          }}>
            {[0,1,2].map(variant => <div className="summary-card-slot" key={variant} aria-label={`Template ${variant + 1}`}>{card(variant)}</div>)}
          </div>
          <div className="summary-share-row">
            <button className="icon-button" aria-label="Choose background" onClick={() => setSheet("Choose Background")}><Camera /></button>
            <button className="button primary" onClick={() => setSheet("Share to")}><Share2 />Share</button>
          </div>
          {done && (
            <button
              className="button full"
              onClick={() => setSheet("Remove Workout")}
            >
              Remove Workout
            </button>
          )}
        </>
      ) : tab === "Feedback" ? (
        <div className="feedback">
          <h2>How was your workout?</h2>
          <div className="rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-label={`Rate ${n} out of 5`}
                aria-pressed={n === rating}
                onClick={() => setRating(n)}
              >
                <Star fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <label className="form-field">
              How tough was it?
              <input
                type="range"
                min="1"
                max="5"
                value={tough}
                onChange={(e) => setTough(e.target.value)}
              />
              <span>
                {
                  ["Too easy", "Easy", "Just right", "Tough", "Too tough"][
                    Number(tough) - 1
                  ]
                }
              </span>
            </label>
          )}
          <label className="form-field">
            Tell Lee
            <textarea
              value={text}
              placeholder="How did it feel?"
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <button
            disabled={!rating}
            className="button primary full"
            onClick={() => {
              update((s) => ({
                feedback: { ...s.feedback, [w.id]: { rating, text } },
                preferences: { ...s.preferences, ["tough:" + w.id]: tough },
              }));
              setNotice(
                "Feedback saved locally. Coach delivery is not connected.",
              );
            }}
          >
            Send to Lee
          </button>
          {flag && (
            <section className="flagged-exercises">
              <h2>Flagged Exercises</h2>
              <Row detail="00:30" onClick={() => setEditFlag(!editFlag)}>
                {flag.exercise}
                <small>{editFlag ? "Done" : "Edit"}</small>
              </Row>
              {editFlag ? (
                <>
                  <textarea
                    aria-label="Flag comments"
                    value={flag.comment}
                    onChange={(e) => changeFlag({ comment: e.target.value })}
                  />
                  <button
                    className="text-button"
                    onClick={() =>
                      update((s) => ({
                        preferences: { ...s.preferences, ["flag:" + w.id]: "" },
                      }))
                    }
                  >
                    Remove
                  </button>
                  <Chips
                    items={flagReasons}
                    selected={flag.reasons}
                    onChange={(v) =>
                      changeFlag({
                        reasons: flag.reasons.includes(v)
                          ? flag.reasons.filter((x) => x !== v)
                          : [...flag.reasons, v],
                      })
                    }
                  />
                </>
              ) : (
                <p>{flag.comment}</p>
              )}
            </section>
          )}
        </div>
      ) : tab === "Distance" ? (
        <>
          <div className="distance-chart">
            <svg
              viewBox="0 0 350 230"
              aria-label="Distance chart without connected GPS data"
            >
              <path
                d="M30 20V205H335M30 160H335M30 110H335M30 60H335"
                stroke="#d4d3da"
                fill="none"
              />
            </svg>
          </div>
          <Row detail="–">Distance</Row>
          <Row detail="N/A">Avg Pace</Row>
          <p className="note">No GPS data was recorded for this web session.</p>
        </>
      ) : (
        <>
          <h2>Workout Intro</h2>
          <h3>
            Primary Flow – Prep for Peak <small>6 min</small>
          </h3>
          <div className="row-group">
            {exerciseNames(w).map((e, i) => (
              <Row
                key={e + i}
                href={`/workouts/${w.id}/session`}
                detail={i % 3 === 0 ? ":30" : "15"}
              >
                {e}
              </Row>
            ))}
          </div>
        </>
      )}
      <input
        ref={input}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture={capture ? "environment" : undefined}
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      <p role="status" className="note">
        {notice}
      </p>
      {sheet && (
        <Sheet
          title={sheet}
          onClose={() => {
            setSheet(null);
            setNotice("");
          }}
        >
          {sheet === "Workout options" ? (
            <><Row onClick={() => setSheet("Share to")}>Share Workout</Row><Row onClick={() => setSheet("Choose Background")}>Change Background</Row>{done && <Row onClick={() => setSheet("Remove Workout")}>Remove Workout</Row>}</>
          ) : sheet === "Choose Background" ? (
            <>
              <p>Your background image will appear on all templates.</p>
              <button
                className="button full"
                onClick={() => {
                  setCapture(true);
                  setTimeout(() => input.current?.click(), 0);
                }}
              >
                Take photo
              </button>
              <button
                className="button full"
                onClick={() => {
                  setCapture(false);
                  setTimeout(() => input.current?.click(), 0);
                }}
              >
                Choose existing photo
              </button>
            </>
          ) : sheet === "Remove Workout" ? (
            <>
              <p>Remove this workout from your local history?</p>
              <button className="button full" onClick={() => setSheet(null)}>
                Cancel
              </button>
              <button
                className="button primary full"
                onClick={() => {
                  update((s) => {
                    const sessions = { ...s.sessions };
                    delete sessions[w.id];
                    return {
                      sessions,
                      completed: s.completed.filter((x) => x !== w.id),
                    };
                  });
                  setSheet(null);
                  setNotice("Workout removed from your history.");
                }}
              >
                Remove Workout
              </button>
            </>
          ) : (
            <>
              {card(template)}
              <div className="button-row">
                <button className="button" onClick={() => void copy(true)}>
                  Guest Pass
                </button>
                <button className="button" onClick={() => void copy()}>
                  Link
                </button>
              </div>
              <p role="status">{notice}</p>
            </>
          )}
        </Sheet>
      )}
      <Link className="summary-home-link" href="/">
        Back to Home
      </Link>
    </>
  );
}
