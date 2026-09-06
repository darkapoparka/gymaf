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
import { useBackend, useWorkoutCatalog } from "@/lib/backend/context";

export function HomeScreen({ screen }: { screen?: string }) {
  const { data } = useLocalData();
  const [intro, setIntro] = useState(false);
  const backend = useBackend();
  const catalog = useWorkoutCatalog();
  const next = backend ? [...(backend.relationship?.workouts || [])].filter(w => w.state === "assigned").sort((a,b) => a.scheduled_date.localeCompare(b.scheduled_date))[0] : null;
  const featured = backend ? catalog.find(w => w.id === next?.id) : workouts[0];
  const coach = backend?.relationship?.relationship.coach_name || (backend ? "Your coach" : "Lee");
  const done = !backend && (screen === "completed" || data.completed.includes("bodyweight-beach"));
  const state = backend ? featured ? "workout" : "pending" : screen || data.preferences.homeState || "workout";
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
                  <h2>{backend && !backend.relationship ? "Connect with your coach to receive your training plan" : `${coach} is putting together your custom workout plan`}</h2>
                  {backend && !backend.relationship && <Link className="button primary" href="/coaches">Explore Coaches</Link>}
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
                    href={featured ? `/workouts/${featured.id}` : "/schedule"}
                    aria-label={featured ? `Open ${featured.title}` : "Open schedule"}
                  >
                    <Photo
                      crop={featured ? { ...featured.image, h: Math.round(featured.image.w * media.home.h / media.home.w) } : media.home}
                      alt={featured?.title || "Workout"}
                      priority
                    />
                  </Link>
                  <button
                    className="intro-hotspot"
                    aria-label={backend ? `${coach} intro` : "Lee’s Intro"}
                    onClick={() => setIntro(true)}
                  />
                  <Link
                    href={featured ? `/workouts/${featured.id}` : "/schedule"}
                    className="today-copy"
                  >
                    <h3>{featured?.title || "Your workout"}</h3>
                    <p>{featured ? `${featured.minutes} min · ${featured.prescription?.exercises.length || 0} exercises` : ""}</p>
                  </Link>
                </article>
              )}
            </>
          )}
          <ActivityStrip />
        </div>
        <div className="week-column">
          <section className="challenge-section">
            <h2>{backend ? "Your coaching" : "Challenges"}</h2>
            <Link className="challenge-card" href={backend ? "/check-ins" : "/progress"}>
              <div>
                <h3>
                  {backend ? coach : <>Strong Start<br />Challenge</>}
                </h3>
                <span className="challenge-ring">
                  <Flag size={31} />
                </span>
                <p>
                  {backend ? `${data.completed.length} completed attempts · Weekly check-in` : <>27 days left • {Math.min(12, 1 + data.completed.length)}/12 workouts completed</>}
                </p>
              </div>
              <div className="week-calendar">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, i) => (
                    <span key={day}>
                      <small>{day}</small>
                      <b className={i === (backend ? (new Date().getDay() + 6) % 7 : 1) ? "selected" : ""}>
                        {backend ? (() => { const d=new Date(); d.setDate(d.getDate() - (d.getDay()+6)%7 + i); return d.getDate(); })() : [29, 30, 1, 2, 3, 4, 5][i]}
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
                const w = catalog.find((w) => w.id === id);
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
              <h3>{coach}</h3>
              <p>Your coach</p>
            </div>
          </div>
          <p className="pre-line">{backend ? "Open your coaching conversation." : coachMessage}</p>
          <Link className="button primary full" href="/messages">
            Messages with {coach}
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
