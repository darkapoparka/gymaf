"use client";
import Link from "./capture-link";
import { useState } from "react";
import { Check, ChevronRight, Flag, CalendarDays } from "lucide-react";
import {
  ActivityStrip,
  Avatar,
  PageHead,
  Photo,
  Row,
  Sheet,
} from "./primitives";
import { media, workouts, coachMessage } from "@/lib/data";
import { useLocalData } from "@/lib/store";

export function HomeScreen({ screen }: { screen?: string }) {
  const { data } = useLocalData();
  const [intro, setIntro] = useState(false);
  const done = screen === "completed" || data.completed.includes("bodyweight-beach");
  const state = screen || data.preferences.homeState || "workout";
  return (
    <>
      <PageHead title={"Morning, " + data.name.split(" ")[0]} />
      <div className="home-grid">
        <div className="today-column">
          {state === "kickoff" || state === "setup" ? (
            <>
              <div className="health-prompt">
                <p>
                  Turn on Apple Health permissions to more accurately record
                  your workouts.
                </p>
                <Link href="/settings/permissions">Continue</Link>
              </div>
              <h2>Kickoff Call</h2>
              <p className="muted">30 minutes • FaceTime</p>
              <article className="kickoff-card">
                <Avatar size={60} />
                <h2>
                  {data.preferences.appointmentBooked === "true"
                    ? "Kickoff Call with Lee"
                    : "Schedule Your Kickoff Call with Lee"}
                </h2>
                {data.preferences.appointmentBooked === "true" && (
                  <p>
                    {data.preferences.appointmentDay} at{" "}
                    {data.preferences.appointmentTime}
                  </p>
                )}
                <Link className="button full" href="/appointments">
                  {data.preferences.appointmentBooked === "true"
                    ? "Reschedule"
                    : "Find a Time That Works"}
                </Link>
              </article>
              <h2>Welcome to Future</h2>
              <p>
                Finish these quick steps so your coach can get you started on
                your plan.
              </p>
              <Row href="/messages">Say Hello to Lee</Row>
              <Row href="/onboarding/details">Complete Fitness Profile</Row>
              <h2>Your First Workout is Coming Soon</h2>
              <p>Lee is building your first workout</p>
            </>
          ) : (
            <>
              <h2 className="today-heading">Today</h2>
              {state === "rest" ? (
                <article className="rest-card">
                  <h2>Rest Day</h2>
                  <Link className="button" href="/workouts/picks">
                    Find Recovery Sessions
                  </Link>
                </article>
              ) : state === "pending" ? (
                <article className="pending-card">
                  <Avatar size={64} />
                  <h2>Lee is putting together your custom workout plan</h2>
                </article>
              ) : state === "running" ? (
                <Link className="running-today" href="/workouts/running">
                  <Photo crop={media.running} alt="Running" />
                  <div>
                    <h2>Run</h2>
                    <p>45 min</p>
                  </div>
                </Link>
              ) : done ? (
                <Link
                  href="/workouts/bodyweight-beach/summary"
                  className="completed-card"
                >
                  <span>
                    <Check size={18} /> BODYWEIGHT BEACH 🚀💥
                  </span>
                  <h2>Completed</h2>
                  <p>
                    View your workout summary <ChevronRight size={16} />
                  </p>
                </Link>
              ) : (
                <article className="today-card">
                  <Link
                    className="today-photo"
                    href="/workouts/bodyweight-beach"
                    aria-label="Open BODYWEIGHT BEACH workout"
                  >
                    <Photo
                      crop={media.home}
                      alt="Bodyweight workout in the Future studio"
                      priority
                    />
                  </Link>
                  <button
                    className="intro-hotspot"
                    aria-label="Lee’s Intro"
                    onClick={() => setIntro(true)}
                  />
                  <Link
                    href="/workouts/bodyweight-beach"
                    className="today-copy"
                  >
                    <h3>BODYWEIGHT BEACH 🚀💥</h3>
                    <p>33 min • quick no weights travel work out</p>
                  </Link>
                </article>
              )}
            </>
          )}
          <ActivityStrip />
        </div>
        <div className="week-column">
          <section className="challenge-section">
            <h2>Challenges</h2>
            <Link className="challenge-card" href="/progress">
              <div>
                <h3>
                  Strong Start
                  <br />
                  Challenge
                </h3>
                <span className="challenge-ring">
                  <Flag size={31} />
                </span>
                <p>
                  27 days left • {Math.min(12, 1 + data.completed.length)}/12
                  workouts completed
                </p>
              </div>
              <div className="week-calendar">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, i) => (
                    <span key={day}>
                      <small>{day}</small>
                      <b className={i === 1 ? "selected" : ""}>
                        {[29, 30, 1, 2, 3, 4, 5][i]}
                      </b>
                    </span>
                  ),
                )}
              </div>
            </Link>
          </section>
          <section className="this-week">
            <h2>This Week</h2>
            {Object.entries(data.schedule)
              .filter(([, id]) => id)
              .map(([day, id]) => {
                const w = workouts.find((w) => w.id === id);
                return (
                  w && (
                    <div key={day}>
                      <p>{day}</p>
                      <Row
                        href={`/workouts/${id}`}
                        icon={
                          data.completed.includes(id) ||
                          id === "morning-yoga" ? (
                            <Check size={17} />
                          ) : (
                            <CalendarDays size={17} />
                          )
                        }
                      >
                        {w.title}
                        <small className="inline-time">
                          {data.preferences["scheduleDuration:" + day] ||
                            w.minutes}{" "}
                          min
                        </small>
                      </Row>
                    </div>
                  )
                );
              })}
            <div className="button-row">
              <Link className="button" href="/schedule">
                Edit Schedule
              </Link>
              <Link className="button" href="/history">
                View History
              </Link>
            </div>
          </section>
        </div>
      </div>
      {intro && (
        <Sheet title="Lee’s Intro" onClose={() => setIntro(false)}>
          <div className="coach-heading">
            <Avatar size={58} />
            <div>
              <h3>Coach Lee</h3>
              <p>Your coach</p>
            </div>
          </div>
          <p className="pre-line">{coachMessage}</p>
          <Link className="button primary full" href="/messages">
            Messages with Lee
          </Link>
        </Sheet>
      )}
    </>
  );
}
export { ScheduleScreen } from "./schedule";

export function HistoryScreen() {
  const { data } = useLocalData();
  const [history, setHistory] = useState<string | null>(null);
  return (
    <>
      <PageHead title="Workout History" back="/" />
      <h2>June 2026</h2>
      <div className="row-group">
        <Row
          href="/workouts/morning-yoga/summary"
          detail="Jun 30 · 18:51"
          icon={<CalendarDays />}
        >
          Morning Yoga Flow
        </Row>
        <Row href="/workouts/running/summary" detail="Jun 4 · 35:00" icon={<CalendarDays />}>Running</Row>
        {data.completed
          .filter((id) => id !== "morning-yoga")
          .map((id) => {
            const w = workouts.find((w) => w.id === id);
            return (
              w && (
                <Row
                  key={id}
                  href={"/workouts/" + id + "/summary"}
                  detail="Completed on this device"
                  icon={<Check />}
                >
                  {w.title}
                </Row>
              )
            );
          })}
      </div>
      <h2>November 2024</h2>
      <div className="row-group">
        {[
          ["SMOOTH LIKE", "Saturday, 16 November 2024 · 35 min · CONDITIONING"],
          ["STARTED FROM THE BOTTOM, NOW WE HERE", "Friday, 15 November 2024 · 29 min · PRESS"],
          ["LEGS LIKE WOAH", "Thursday, 14 November 2024 · 35 min · SQUAT"],
        ].map(([title, detail]) => <Row key={title} detail={detail} onClick={() => setHistory(title)}>{title}</Row>)}
      </div>
      {history && <Sheet title={history} onClose={() => setHistory(null)}><p>This session appears in the captured workout history. Its exercise breakdown was not included in the source.</p><Link className="button primary full" href="/workouts">Find a Workout</Link></Sheet>}
    </>
  );
}
