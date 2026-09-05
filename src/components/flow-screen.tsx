"use client";
import { OnboardingScreen } from "./onboarding";
import { AccountFlows } from "./account-flows";
import { ProgressFlows } from "./progress-flows";
import { WorkoutSettings } from "./workout-settings";
import { SystemPreviews } from "./system-previews";
import { ProgressPhotos } from "./progress-photos";
import { WeightProgress } from "./weight-progress";
import { CoverPicker } from "./cover-picker";
import { MattCoach } from "./coach-alternatives";
export function FlowScreen({ path }: { path: string }) {
  if (path === "progress/photos" || path === "progress/photos/add") return <ProgressPhotos adding={path.endsWith("/add")} />;
  if (path === "progress/target" || path === "progress/log-weight") return <WeightProgress mode={path.endsWith("target") ? "target" : "log"} />;
  if (path === "profile/cover") return <CoverPicker />;
  if (path === "coaches/matt") return <MattCoach />;
  if (path.startsWith("system/")) return <SystemPreviews path={path} />;
  if (
    [
      "settings/workout",
      "settings/instructions",
      "settings/tones",
      "settings/heart-rate",
      "settings/zones",
    ].includes(path)
  )
    return <WorkoutSettings path={path} />;
  if (
    path.startsWith("account") ||
    path.startsWith("settings/") ||
    path === "coaches/change"
  )
    return <AccountFlows path={path} />;
  if (
    path.startsWith("onboarding/") ||
    path.startsWith("coaches") ||
    path.startsWith("checkout") ||
    path.startsWith("login") ||
    path === "appointments"
  )
    return <OnboardingScreen path={path} />;
  return <ProgressFlows path={path} />;
}
