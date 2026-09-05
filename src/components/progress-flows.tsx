"use client";
import { useCaptureState } from "@/lib/capture-context";
import { useRef } from "react";
import Image from "next/image";
import Link from "./capture-link";
import { useAppRouter as useRouter } from "./capture-link";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  ImagePlus,
  Plus,
  Star,
  X,
} from "lucide-react";
import { Fields, FlowHead, Toggle, usePreferences } from "./flow-primitives";
import { Sheet, Tabs } from "./primitives";
import { GuestQR } from "./guest-qr";
import { SavedVideo } from "./record-workout";
import { photoData } from "@/lib/media-store";

export const metricNames = [
  "Activity Rings",
  "Minutes of Activity",
  "Daily Steps",
  "Resting Heart Rate",
  "Total Mileage",
  "Average Pace",
  "Longest Run",
  "Progress Photos",
  "Weight",
];
export function ProgressFlows({ path }: { path: string }) {
  const { data, get, set, update } = usePreferences();
  const router = useRouter();
  const [sheet, setSheet] = useCaptureState<string | null>("progressFlow.sheet", null);
  const [notice, setNotice] = useCaptureState("progressFlow.notice", "");
  const [date] = useCaptureState("progressFlow.date", new Date().toISOString().slice(0, 10));
  const [draftPhotos, setDraftPhotos] = useCaptureState<Record<string, string>>("progressFlow.draftPhotos", {});
  const [tab, setTab] = useCaptureState("progressFlow.tab", "Event");
  const [rating, setRating] = useCaptureState("progressFlow.rating", Number(get("coachRating", "0")));
  const fileInput = useRef<HTMLInputElement>(null);
  const metrics = JSON.parse(
    get("metrics", JSON.stringify(metricNames.slice(0, 3))),
  ) as string[];
  async function selectPhoto(file?: File) {
    if (!file) return;
    try {
      const src = await photoData(file);
      setDraftPhotos({ Message: src });
      setSheet(null);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not load that photo.");
    }
  }
  function reorder(index: number, delta: number) {
    const list = [...metrics];
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    set("metrics", JSON.stringify(list));
  }
  if (path === "progress/metrics" || path === "progress/add-metric")
    return (
      <div className="flow-page">
        <FlowHead title="Metrics" back="/progress" />
        <h2>My Metrics</h2>
        <div className="row-group">
          {metrics.map((m, i) => (
            <div key={m} className="metric-edit-row">
              <button
                className="icon-button"
                aria-label={"Remove " + m}
                onClick={() =>
                  set("metrics", JSON.stringify(metrics.filter((v) => v !== m)))
                }
              >
                <X size={17} />
              </button>
              <span>{m}</span>
              <button
                className="icon-button"
                disabled={!i}
                aria-label={"Move " + m + " up"}
                onClick={() => reorder(i, -1)}
              >
                <ArrowUp size={18} />
              </button>
              <button
                className="icon-button"
                disabled={i === metrics.length - 1}
                aria-label={"Move " + m + " down"}
                onClick={() => reorder(i, 1)}
              >
                <ArrowDown size={18} />
              </button>
            </div>
          ))}
        </div>
        {Object.entries({
          "Health and Wellbeing": ["Resting Heart Rate"],
          Activity: [
            "Activity Rings",
            "Minutes of Activity",
            "Daily Steps",
            "Total Mileage",
            "Average Pace",
            "Longest Run",
          ],
          "Body Measurements": ["Progress Photos", "Weight"],
        }).map(([group, names]) => (
          <section key={group}>
            <h2>{group}</h2>
            {names
              .filter((m) => !metrics.includes(m))
              .map((m) => (
                <button
                  className="flow-row"
                  key={m}
                  onClick={() =>
                    set("metrics", JSON.stringify([...metrics, m]))
                  }
                >
                  <Plus size={18} />
                  <span>{m}</span>
                </button>
              ))}
          </section>
        ))}
        <Link className="button primary full" href="/progress">
          Done
        </Link>
      </div>
    );
  if (path === "progress/consistency")
    return (
      <div className="flow-page">
        <FlowHead title="Workout Consistency" back="/progress" />
        <h2>Overview</h2>
        <div className="consistency-summary">
          <strong>{data.completed.length + 1}</strong>
          <span>WORKOUT DAYS</span>
        </div>
        <div className="weekly-days">
          {["Jun 8–14", "Jun 15–21", "Last Week", "This Week"].map((w, i) => (
            <div key={w}>
              <b>{w}</b>
              <span>
                {i === 3 ? data.completed.length + 1 : 0}{" "}
                {i === 3 ? "Day" : "Days"}
              </span>
            </div>
          ))}
        </div>
        <div className="calendar-large">
          {Array.from({ length: 30 }, (_, i) => (
            <button
              key={i}
              className={i === 29 ? "selected" : ""}
              onClick={() => setSheet("Thursday’s Workout")}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {sheet && (
          <Sheet title={sheet} onClose={() => setSheet(null)}>
            <h1>Running</h1>
            <button
              className="button full"
              onClick={() => setSheet("Did you finish your workout?")}
            >
              Mark Complete
            </button>
            <Link
              className="button primary full"
              href="/workouts/running/session"
            >
              Start Workout
            </Link>
            {sheet === "Did you finish your workout?" && (
              <>
                <button
                  className="button primary full"
                  onClick={() => {
                    update((s) => ({
                      completed: [...new Set([...s.completed, "running"])],
                    }));
                    setSheet(null);
                  }}
                >
                  YES
                </button>
                <button className="button full" onClick={() => setSheet(null)}>
                  CANCEL
                </button>
              </>
            )}
          </Sheet>
        )}
      </div>
    );
  if (path === "messages/photo") return <div className="flow-page">
    <FlowHead title="Send Photo" back="/messages"/>
    <input className="visually-hidden" ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>void selectPhoto(e.target.files?.[0])}/>

          <>
            <div className="message-photo-preview">
              {draftPhotos.Message ? (
                <Image
                  src={draftPhotos.Message}
                  alt="Message attachment preview"
                  width={500}
                  height={500}
                  unoptimized
                />
              ) : (
                <button
                  className="empty-media"
                  onClick={() => fileInput.current?.click()}
                >
                  <ImagePlus size={50} />
                  Choose Photo
                </button>
              )}
            </div>
            <Fields
              fields={[
                { key: "photoMessage", label: "Message", type: "textarea" },
              ]}
              label="Send to Lee"
              onSave={(v) => {
                if (!draftPhotos.Message) {
                  setNotice("Choose a photo first.");
                  return;
                }
                update((s) => ({
                  photos: [
                    ...s.photos,
                    {
                      id: crypto.randomUUID(),
                      src: draftPhotos.Message,
                      date,
                      kind: "message",
                    },
                  ],
                  messages: [
                    ...s.messages,
                    {
                      id: crypto.randomUUID(),
                      text: v.photoMessage,
                      photo: draftPhotos.Message,
                    },
                  ],
                }));
                router.push("/messages");
              }}
            >
              <p className="note">
                Saved on this device. Coach delivery is not connected.
              </p>
            </Fields>
          </>

    {notice && <p role="alert">{notice}</p>}
  </div>;
  if (path === "messages/rate")
    return (
      <div className="flow-page coach-rating">
        <FlowHead title="" back="/messages" close />
        <h1>How is it going with Lee?</h1>
        <p>
          Your feedback helps us improve your Future Pro experience. Your
          response is private and will not be shared with your coach.
        </p>
        <div className="rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              aria-label={`Rate coach ${n} out of 5`}
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
            >
              <Star fill={n <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
        <button
          className="button primary full"
          disabled={!rating}
          onClick={() => {
            set("coachRating", String(rating));
            router.push("/messages");
          }}
        >
          SUBMIT
        </button>
        <p className="note">Feedback stays in this local preview.</p>
      </div>
    );
  if (path === "messages/gifs")
    return (
      <div className="flow-page">
        <FlowHead title="GIFs" back="/messages" close />
        <div className="empty-media">
          <ImagePlus size={44} />
          <h2>GIF search unavailable</h2>
          <p>A media provider is not connected.</p>
          <Link className="button" href="/messages/photo">
            Choose a photo instead
          </Link>
        </div>
      </div>
    );
  if (path === "messages/videos")
    return (
      <div className="flow-page">
        <FlowHead title="Videos" back="/messages" />
        {data.messages
          .filter((m) => m.video)
          .map((m) => (
            <SavedVideo key={m.id} id={m.video!} />
          ))}
        {!data.messages.some((m) => m.video) && (
          <div className="empty-media">
            <Camera size={44} />
            <h2>No shared videos yet</h2>
            <p>Videos you record and save during a workout appear here.</p>
            <Link className="button" href="/workouts/morning-yoga/session">
              Go to Workout
            </Link>
          </div>
        )}
      </div>
    );
  if (path === "profile/interests")
    return (
      <div className="flow-page">
        <FlowHead title="Interests & Hashtags" back="/profile/edit" />
        <Fields
          fields={[
            {
              key: "interestInput",
              label: "Add Interest",
              required: true,
              placeholder: "running",
            },
          ]}
          label="Add Interest"
          onSave={(v) => {
            update({
              interest: [
                ...new Set([
                  ...data.interest.split(","),
                  v.interestInput.replace(/^#/, ""),
                ]),
              ].join(","),
            });
            router.push("/profile/edit");
          }}
        />
      </div>
    );
  if (path === "profile/event")
    return (
      <div className="flow-page">
        <FlowHead title="Add" back="/profile" close />
        <Tabs items={["Travel", "Event"]} value={tab} onChange={setTab} />
        <Fields
          key={tab}
          fields={[
            {
              key: "eventName",
              label:
                tab === "Travel"
                  ? "Where are you going?"
                  : "What event do you have?",
              placeholder:
                tab === "Travel" ? "Somewhere cool" : "i.e. Half Marathon",
              required: true,
            },
            {
              key: "eventDetails",
              label: "Provide details that you want your coach to know",
              type: "textarea",
            },
            {
              key: "eventStart",
              label: "Starts",
              type: "date",
              value: date,
              required: true,
            },
            {
              key: "eventEnd",
              label: "Ends",
              type: "date",
              value: date,
              required: true,
            },
          ]}
          label="Save"
          onSave={(v) => {
            if (v.eventEnd < v.eventStart) {
              setNotice("End date must be on or after the start date.");
              return;
            }
            update((s) => ({
              events: [
                ...s.events,
                {
                  id: crypto.randomUUID(),
                  name: v.eventName,
                  date: v.eventStart,
                },
              ],
              preferences: { ...s.preferences, ...v },
            }));
            router.push("/profile");
          }}
        >
          {tab === "Event" && (
            <Toggle
              label="Profile Visibility"
              pref="eventVisibility"
              defaultOn
              description="Shown on your profile for guest pass friends. Turning this off will make it visible only to your coach."
            />
          )}
        </Fields>
        {notice && <p role="alert">{notice}</p>}
      </div>
    );
  return (
    <div className="flow-page invite-flow">
      <FlowHead title="Invite Friends to Future Pro" back="/friends" close />
      <h1>
        Gift a free month of training, plus earn a $100 membership credit for
        yourself when someone you refer commits to their first paid month.
      </h1>
      <button
        className="button primary full"
        onClick={() => setSheet("Send Guest Pass")}
      >
        Send Guest Pass
      </button>
      <h2>Referral Credits</h2>
      <div className="referral-stats">
        <div>
          <strong>0</strong>
          <span>Lifetime</span>
        </div>
        <div>
          <strong>0</strong>
          <span>Pending</span>
        </div>
        <div>
          <strong>0</strong>
          <span>Trial in Progress</span>
        </div>
      </div>
      <p>No Guest Pass referrals yet</p>
      {sheet && (
        <Sheet title={sheet} onClose={() => setSheet(null)}>
          <p>
            Show or send this link to friends to share your guest pass preview.
          </p>
          <GuestQR url={(typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:3210")+"/welcome"}/>
          <code>
            {typeof window !== "undefined" ? window.location.origin : ""}
            /welcome
          </code>
          <button
            className="button primary full"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  window.location.origin + "/welcome",
                );
                setNotice("Preview link copied.");
              } catch {
                setNotice("Copy the link shown above.");
              }
            }}
          >
            Share Link
          </button>
          <p role="status">{notice}</p>
        </Sheet>
      )}
    </div>
  );
}
