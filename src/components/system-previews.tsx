"use client";
import { useCaptureState } from "@/lib/capture-context";
import Link from "./capture-link";
import { FutureMark } from "./future-mark";
import { Pause, Play } from "lucide-react";
import { Rings } from "./primitives";
import { FlowHead } from "./flow-primitives";
export function SystemPreviews({ path }: { path: string }) {
  const [expanded, setExpanded] = useCaptureState("system.expanded", false);
  const [paused, setPaused] = useCaptureState("system.paused", false);
  if (path === "system/launch") return <Link href="/" className="launch-screen" aria-label="Continue to Future Pro"><FutureMark /></Link>;
  return (
    <div className="flow-page">
      <FlowHead
        title={
          path.endsWith("widgets")
            ? "Widgets"
            : path.endsWith("dynamic-island")
              ? "Dynamic Island"
              : "Live Activities"
        }
        back="/settings/about"
      />
      <p className="note">
        Interactive web presentation of the captured iOS surface.
      </p>
      {path.endsWith("widgets") ? (
        <div className="widget-grid">
          {[0, 1, 2, 3].map((n) => (
            <Link
              key={n}
              href={n % 2 ? "/progress" : "/workouts/morning-yoga/summary"}
              className="future-widget"
            >
              {n < 2 ? (
                <>
                  <h2>Workout Complete</h2>
                  <span>SEE DETAILS ›</span>
                </>
              ) : (
                <>
                  <Rings />
                  <div>
                    EXERCISE <b>46 MIN</b>
                    <br />
                    MOVE <b>0 CAL</b>
                    <br />
                    STAND <b>0 HRS</b>
                  </div>
                </>
              )}
            </Link>
          ))}
        </div>
      ) : path.endsWith("dynamic-island") ? (
        <div className="island-stage">
          <button
            className={"dynamic-island " + (expanded ? "expanded" : "")}
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            <span>4:17</span>
            {expanded && (
              <>
                <b>Modified Plyo Push-Up</b>
                <span>0:24</span>
                <small>14 MIN LEFT</small>
              </>
            )}
          </button>
          <p>Tap to {expanded ? "collapse" : "expand"}</p>
        </div>
      ) : (
        <div className="lock-screen-preview">
          <p>Tue Jan 9</p>
          <strong className="lock-time">9:41</strong>
          <article className="live-activity">
            <div>
              <span>4:17</span>
              <button
                className="icon-button"
                aria-label={paused ? "Resume workout" : "Pause workout"}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play /> : <Pause />}
              </button>
            </div>
            <Link href="/workouts/morning-yoga/session">
              <b>{paused ? "Workout Paused" : "Modified Plyo Push-Up"}</b>
              <small>14 MIN LEFT</small>
            </Link>
            <strong>0:24</strong>
          </article>
        </div>
      )}
    </div>
  );
}
