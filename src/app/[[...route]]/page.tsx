import { notFound } from "next/navigation";
import { FutureApp } from "@/components/future-app";
import { workouts } from "@/lib/data";
import { isFlowRoute } from "@/lib/flow-routes";
import { CaptureProvider, type CaptureFixture } from "@/lib/capture-context";
import fixtures from "../../../docs/reference-fixtures.json";
import captureRoutes from "../../../docs/screen-coverage.json";

const pages = new Set([
  "",
  "progress",
  "progress/activity",
  "progress/steps",
  "progress/weight",
  "progress/metric",
  "messages",
  "friends",
  "profile",
  "profile/edit",
  "settings",
  "welcome",
  "workouts",
  "workouts/picks",
  "schedule",
  "history",
]);
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ route?: string[] }>;
  searchParams: Promise<{ activity?: string; capture?: string }>;
}) {
  const path = (await params).route?.join("/") ?? "";
  const validWorkout = workouts.some((w) =>
    [
      "workouts/" + w.id,
      "workouts/" + w.id + "/session",
      "workouts/" + w.id + "/record",
      "workouts/" + w.id + "/summary",
    ].includes(path),
  );
  if (!pages.has(path) && !validWorkout && !isFlowRoute(path)) notFound();
  const { activity, capture } = await searchParams;
  const app = (
    <FutureApp
      path={path}
      activity={typeof activity === "string" ? activity : undefined}
    />
  );
  if (typeof capture !== "string") return app;
  const fixture = (fixtures as Record<string, CaptureFixture>)[capture];
  const route = captureRoutes.find(s => s.id === capture)?.route;
  if (!fixture) notFound();
  // UI selections seed only the original captured surface. Its isolated data can follow the flow.
  const selectedFixture = route?.split("?")[0] === "/" + path ? fixture : { ...fixture, ui: {} };
  return <CaptureProvider key={capture} fixture={selectedFixture}>{app}</CaptureProvider>;
}
