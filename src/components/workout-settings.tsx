"use client";
import { useCaptureState } from "@/lib/capture-context";
import {
  Choices,
  Fields,
  FlowHead,
  FlowRow,
  Toggle,
  usePreferences,
} from "./flow-primitives";
import { Sheet } from "./primitives";
import { useAppRouter as useRouter } from "./capture-link";

function playTone(beep: boolean) {
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  [beep ? 880 : 660, beep ? 880 : 990].forEach((frequency, i) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.15, now + i * 0.13);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.13 + 0.25);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now + i * 0.13);
    oscillator.stop(now + i * 0.13 + 0.26);
  });
  setTimeout(() => void ctx.close(), 650);
}
export function WorkoutSettings({ path }: { path: string }) {
  const { get, set, setMany } = usePreferences();
  const router = useRouter();
  const [sheet, setSheet] = useCaptureState<string | null>("workoutSettings.sheet", null);
  const [zone, setZone] = useCaptureState("workoutSettings.zone", 1);
  const title = path.endsWith("instructions")
    ? "Exercise Instructions"
    : path.endsWith("tones")
      ? "Workout Tones"
      : path.endsWith("heart-rate") || path.endsWith("zones")
        ? "Heart Rate Zones"
        : "Workout Settings";
  return (
    <div className="flow-page">
      <FlowHead
        title={title}
        back={
          path === "settings/workout"
            ? get("workoutReturn", "/settings")
            : "/settings/workout"
        }
        close={path === "settings/workout"}
      />
      {path.endsWith("instructions") ? (
        <>
          <Choices
            items={["Never", "Periodic", "Every Time"]}
            value={get("exerciseInstructions", "Periodic")}
            onChange={(v) => set("exerciseInstructions", v)}
          />
          <div className="instruction-descriptions">
            <h2>Never</h2>
            <p>Only hear voice cues from your coach.</p>
            <h2>Periodic</h2>
            <p>
              Recommended. Detailed movement instructions will be played for
              exercises you haven’t done recently.
            </p>
            <h2>Every Time</h2>
            <p>
              Detailed movement instructions will be played for every exercise
              in your workout that does not have a voiceover from your coach.
            </p>
          </div>
        </>
      ) : path.endsWith("tones") ? (
        <Choices
          items={["Marimba (Default)", "Beep"]}
          value={get("workoutTone", "Marimba (Default)")}
          onChange={(v) => {
            set("workoutTone", v);
            playTone(v === "Beep");
          }}
        />
      ) : path.endsWith("heart-rate") ? (
        <>
          <Fields
            fields={[
              {
                key: "dob",
                label: "Birthdate",
                type: "date",
                value: "1998-02-17",
              },
              {
                key: "sex",
                label: "Biological Sex",
                options: ["Male", "Female", "Not specified"],
              },
              {
                key: "heartRateMax",
                label: "Heart Rate Max (BPM)",
                type: "number",
                min: "60",
                max: "250",
                value: "193",
                required: true,
              },
            ]}
            onSave={(v) => {
              setMany(v);
              router.push("/settings/workout");
            }}
          />
          <p className="note">
            Set your age and biological sex to see a suggested max heart rate.
            If you have any special conditions or questions about your max heart
            rate, consult your physician.
          </p>
          <p className="note">
            193 BPM is the captured reference value, not a personalized
            recommendation.
          </p>
        </>
      ) : path.endsWith("zones") ? (
        <>
          <p>
            Heart rate zones are a valuable tool for you and your coach to
            measure the intensity of your workouts. Biometric data is used to
            calculate your personal zones automatically.
          </p>
          <div className="zone-tabs">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-pressed={n === zone}
                onClick={() => setZone(n)}
                style={{
                  background: [
                    "#739eb7",
                    "#63b479",
                    "#d5c459",
                    "#da9868",
                    "#c9778d",
                  ][n - 1],
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <h2>
            Zone {zone} •{" "}
            {["Very Light", "Light", "Moderate", "Hard", "Maximum"][zone - 1]}
          </h2>
          <p>
            {zone === 1
              ? "YOUR RANGE: <115 BPM"
              : "Based on your selected maximum heart rate"}
          </p>
          <p>
            {zone === 1
              ? "Easy warm up or recovery pace. Improves overall health, helps recovery, and prepares your body to train at higher heart rate zones."
              : "This reference view shows the selected training intensity zone. Your coach can help interpret your personal heart rate information."}
          </p>
        </>
      ) : (
        <>
          <h2>AirPlay Mirroring</h2>
          <FlowRow
            label="AirPlay to TV"
            onClick={() => setSheet("AirPlay to TV")}
          />
          <h2>Audio</h2>
          <Toggle
            pref="exerciseAnnouncement"
            label="Exercise Announcement"
            defaultOn
            description="Recommended. When enabled, the name and quantity or duration of the exercise will be played at the beginning of each movement."
          />
          <FlowRow
            label="Exercise Instructions"
            detail={get("exerciseInstructions", "Periodic")}
            href="/settings/instructions"
          />
          <p className="note">
            Choose how often to hear detailed movement instructions during your
            workout.
          </p>
          <Toggle pref="workoutTones" label="Workout Tones" defaultOn />
          <FlowRow
            label="Tone"
            detail={get("workoutTone", "Marimba (Default)")}
            href="/settings/tones"
          />
          <p className="note">
            Recommended. When enabled, sounds will be played to indicate the
            beginning and end of exercises.
          </p>
          <label className="form-field">
            Audio Volume
            <input
              type="range"
              min="0"
              max="100"
              value={get("audioVolume", "70")}
              onChange={(e) => set("audioVolume", e.target.value)}
            />
          </label>
          <h2>Heart Rate</h2>
          <FlowRow
            label="Connect Heart Rate Monitor"
            onClick={() => setSheet("Connect Heart Rate Monitor")}
          />
          <p className="note">
            When connected, detailed heart rate information during your workouts
            will be available to you and your coach.
          </p>
          <Toggle pref="heartRateZones" label="Heart Rate Zones" defaultOn />
          <FlowRow
            label="Suggested Max"
            detail={get("heartRateMax", "193") + " BPM"}
            href="/settings/heart-rate"
          />
          <FlowRow label="View Your Zones" href="/settings/zones" />
          <h2>Watch</h2>
          <Toggle
            pref="watchHaptics"
            label="Haptics on Watch"
            defaultOn
            description="When enabled, haptics will play as your workout advances on your Apple Watch."
          />
          <Toggle
            pref="rotateCrown"
            label="Rotate Crown to Modify Weight"
            defaultOn
            description="When enabled, rotate the Digital Crown on your Apple Watch to change the weight that you’re using for an exercise."
          />
          <Toggle
            pref="doubleTap"
            label="Double-Tap Gesture to Advance to Next Set"
            defaultOn
            description="When enabled, tapping your index finger and thumb together advances the workout on supported Apple Watch models."
          />
        </>
      )}
      {sheet && (
        <Sheet title={sheet} onClose={() => setSheet(null)}>
          <p>
            This feature requires a compatible native device connection. No
            device is connected to this web preview.
          </p>
          <button
            className="button primary full"
            onClick={() => setSheet(null)}
          >
            Done
          </button>
        </Sheet>
      )}
    </div>
  );
}
