"use client";
import Link from "./capture-link";
import { useEffect, useSyncExternalStore } from "react";
import { useCapture } from "@/lib/capture-context";
import { CaptureKeyboard } from "./capture-keyboard";
import { WeightProgress } from "./weight-progress";
import { CaptureStatus } from "./capture-status";
import { Navigation } from "./primitives";
import { HomeScreen, ScheduleScreen, HistoryScreen } from "./home";
import {
  WorkoutDetail,
  WorkoutsScreen,
  WorkoutSession,
  SummaryScreen,
} from "./workouts";
import { ActivityScreen, MeasurementScreen, ProgressScreen } from "./progress";
import {
  EditProfileScreen,
  FriendsScreen,
  MessagesScreen,
  ProfileScreen,
} from "./community";
import { SettingsScreen, WelcomeScreen } from "./settings";
import { workouts } from "@/lib/data";
import { isFlowRoute } from "@/lib/flow-routes";
import { RecordWorkout } from "./record-workout";
import { FlowScreen } from "./flow-screen";

const subscribeToClient = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function FutureApp({
  path,
  activity,
}: {
  path: string;
  activity?: string;
}) {
  const clientReady = useSyncExternalStore(subscribeToClient, clientSnapshot, serverSnapshot);
  const capture = useCapture();
  useEffect(() => {
    if (!clientReady || !capture) return;
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, Number(capture.ui.scrollY) || 0);
      const carousel = document.querySelector<HTMLElement>(".summary-carousel");
      if (carousel && capture.ui["summary.template"]) {
        const width = carousel.firstElementChild?.getBoundingClientRect().width || 292;
        carousel.scrollTo({ left: (width + 10) * Number(capture.ui["summary.template"]) });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [clientReady, capture]);
  if (!clientReady) return <main className="app-shell" aria-busy="true"><span className="visually-hidden">Loading your plan</span></main>;
  const workout = workouts.find(
    (w) =>
      "workouts/" + w.id === path || path.startsWith("workouts/" + w.id + "/"),
  );
  const immersive =
    (!!workout && !path.endsWith("/summary")) ||
    path === "welcome" ||
    path === "settings" ||
    isFlowRoute(path);
  let content;
  if (isFlowRoute(path)) content = <FlowScreen path={path} />;
  else if (workout)
    content = path.endsWith("/record") ? (
      <RecordWorkout workout={workout} />
    ) : path.endsWith("/session") ? (
      <WorkoutSession workout={workout} screen={activity} />
    ) : path.endsWith("/summary") ? (
      <SummaryScreen workout={workout} screen={activity} />
    ) : (
      <WorkoutDetail workout={workout} />
    );
  else
    switch (path) {
      case "workouts":
        content = <WorkoutsScreen activity={activity} />;
        break;
      case "workouts/picks":
        content = <WorkoutsScreen all />;
        break;
      case "progress":
        content = <ProgressScreen />;
        break;
      case "progress/activity":
        content = <ActivityScreen />;
        break;
      case "progress/steps":
        content = <MeasurementScreen />;
        break;
      case "progress/metric":
        content = <MeasurementScreen metric={activity} />;
        break;
      case "progress/weight":
        content = <WeightProgress />;
        break;
      case "messages":
        content = <MessagesScreen />;
        break;
      case "friends":
        content = <FriendsScreen />;
        break;
      case "profile":
        content = <ProfileScreen />;
        break;
      case "profile/edit":
        content = <EditProfileScreen />;
        break;
      case "settings":
        content = <SettingsScreen />;
        break;
      case "welcome":
        content = <WelcomeScreen />;
        break;
      case "schedule":
        content = <ScheduleScreen />;
        break;
      case "history":
        content = <HistoryScreen />;
        break;
      default:
        content = <HomeScreen screen={activity} />;
    }
  return (
    <>
      {!path.endsWith("/record") && <CaptureStatus />}
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {!immersive && (
        <div className="desktop-brand">
          <Link href="/" className="wordmark">
            future<span>Pro</span>
          </Link>
          <Link href="/profile">Profile</Link>
        </div>
      )}
      <CaptureKeyboard key={"keyboard:" + path + ":" + (capture?.id || "")} />
      {/* THESIS: Recreate the user-pinned Future Pro iOS Mobbin capture set on the web.
          OWN-WORLD: Source Season Mix, SF Pro, lavender sheets, real Future imagery and emblem.
          STORY: Choose a coach, train, review progress, communicate, manage the plan.
          FIRST VIEWPORT: Match the selected mobile source state; desktop is an adaptation.
          FORM: Operate mode. Compact touch controls and layered native-style sheets.
          FINISH: All 84 flow families are represented; screen-level evidence is tracked separately.
          Visual authority: docs/reference-flows.json and docs/screen-coverage.json. */}
      <main
        id="main"
        className={`app-shell ${immersive ? "immersive" : ""} ${path === "" ? "home-page" : ""} ${path === "profile" ? "profile-page" : ""} ${path === "messages" ? "chat-shell" : ""} ${path === "workouts" ? "workouts-sheet" : ""}`}
        key={path}
      >
        {content}
      </main>
      {["", "progress", "messages", "friends", "profile", "progress/photos", "progress/photos/add", "progress/weight", "progress/target", "progress/log-weight"].includes(path) && (
        <Navigation path={path} />
      )}
    </>
  );
}
