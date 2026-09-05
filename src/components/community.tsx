"use client";
import { useCaptureState } from "@/lib/capture-context";
import Link from "./capture-link";
import Image from "next/image";
import { useAppRouter as useRouter } from "./capture-link";
import {
  ArrowUp,
  Plus,
  Images,
  Gift,
  Share2,
  Pencil,
  Settings,
  Check,
  CalendarDays,
} from "lucide-react";
import { ConversationHistory } from "./conversation-history";
import { AchievementDialog } from "./achievement-dialog";
import { coverChoices } from "@/lib/reference-media";
import { FutureMark } from "./future-mark";
import { media, coachMessage } from "@/lib/data";
import { useLocalData } from "@/lib/store";
import {
  Avatar,
  IconButton,
  PageHead,
  Photo,
  Rings,
  Row,
  Sheet,
} from "./primitives";

export function MessagesScreen() {
  const { data, update } = useLocalData();
  const [history] = useCaptureState("community.history", "workout");
  const [achievement, setAchievement] = useCaptureState("community.achievement", false);
  const [text, setText] = useCaptureState("community.text", "");
  const [notice, setNotice] = useCaptureState("community.notice", "");
  const [attachments, setAttachments] = useCaptureState("community.attachments", false);
  const router = useRouter();
  function send() {
    if (!text.trim()) return;
    update((s) => ({
      messages: [...s.messages, { id: crypto.randomUUID(), text: text.trim() }],
    }));
    setText("");
    setNotice("Saved locally. Coach delivery is not connected.");
  }
  return (
    <div className="messages-page">
      <header className="chat-header">
        <Avatar size={23} />
        <h1>Lee</h1>
        <IconButton
          label="Shared media"
          onClick={() => router.push("/messages/videos")}
        >
          <Images size={23} />
        </IconButton>
      </header>
      <div className="chat-messages">
        <ConversationHistory snapshot={history} />
        {history === "workout" && <><p className="coach-message">{coachMessage}</p>
        <p className="chat-timestamp">Yesterday, 11:59 PM</p>
        <div className="activity-message">
          <small>Yesterday</small>
          <div>
            <Rings active size={42} />
            <span>
              <small>Active</small>1 min
            </span>
          </div>
        </div>
        <Link className="chat-workout" href="/workouts/bodyweight-beach">
          <Photo
            crop={{ ...media.home, y: 515, h: 562 }}
            alt="Bodyweight workout"
          />
          <div>
            <small>
              TODAY’S WORKOUT <Check size={13} />
            </small>
            <h2>BODYWEIGHT BEACH 🚀💥</h2>
            <p>QUICK NO WEIGHTS TRAVEL WORK OUT</p>
            <b>33 MIN</b>
          </div>
        </Link>
        <Link className="coach-rating-link" href="/messages/rate">
          How is it going with Lee?
        </Link>
        </>}
        {data.messages.map((m) => (
          <p key={m.id} className="outgoing-message">
            {m.photo && (
              <Image
                src={m.photo}
                alt="Your photo attachment"
                width={360}
                height={400}
                unoptimized
              />
            )}
            {m.text}
          </p>
        ))}
        <p role="status" className="note">
          {notice}
        </p>
      </div>
      <form
        className="message-composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <IconButton label="Add attachment" onClick={() => setAttachments(true)}>
          <Plus />
        </IconButton>
        <label>
          <span className="sr-only">Message to Lee</span>
          <input
            aria-label="Message to Lee"
            placeholder="Send a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            aria-label="Save message"
            disabled={!text.trim()}
          >
            <ArrowUp size={20} />
          </button>
        </label>
      </form>
      {achievement && <AchievementDialog onClose={() => setAchievement(false)} />}
      {attachments && (
        <Sheet
          title="Add to your message"
          onClose={() => setAttachments(false)}
        >
          <div className="attachment-grid">
            {[
              ["Camera", "/messages/photo"],
              ["Photos", "/messages/photo"],
              ["GIFs", "/messages/gifs"],
              ["Travel", "/profile/event"],
              ["Equipment", "/settings/location"],
              ["Injury", "/settings/injury"],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="button">
                {label}
              </Link>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

export function FriendsScreen() {
  const router = useRouter();
  const [invite, setInvite] = useCaptureState("community.invite", false);
  const [notice, setNotice] = useCaptureState("community.notice", "");
  return (
    <>
      <PageHead title="Friends">
        <IconButton
          label="Invite friends"
          onClick={() => router.push("/friends/invite")}
        >
          <Gift />
        </IconButton>
        <IconButton label="Share profile" onClick={() => setInvite(true)}>
          <Share2 />
        </IconButton>
      </PageHead>
      <div className="friends-layout">
        <article className="friends-card">
          <Photo
            crop={media.friends}
            alt="Friends encouraging each other through their workouts"
            priority
          />
          <div>
            <h2>Let your friends pull you forward.</h2>
            <p>
              Track your friends’ workouts, motivate each other, and see who’s
              leading the week.
            </p>
          </div>
        </article>
        <div>
          <h2>Weekly Leaderboard</h2>
          <div className="leaderboard-row">
            <span className="initial-avatar">Y</span>
            <div>
              You<small>No workouts this week</small>
            </div>
          </div>
          <h2>Add Friends</h2>
          <p className="muted">Invite your friends to train together.</p>
          <Link className="button" href="/friends/invite">
            Invite Friends
          </Link>
          <h2>Connect With Existing Members</h2>
          <p>Share your profile with an existing member to connect.</p>
          <button className="button" onClick={() => setInvite(true)}>
            Share Profile
          </button>
        </div>
      </div>
      {invite && (
        <Sheet title="Invite Friends" onClose={() => setInvite(false)}>
          <h3>Better together.</h3>
          <p>
            Share your local profile preview with a friend. Invitations are not
            connected to Future Pro accounts.
          </p>
          <button
            className="button primary full"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  window.location.origin + "/profile",
                );
                setNotice("Profile preview link copied.");
              } catch {
                setNotice("Copy the profile URL from your browser.");
              }
            }}
          >
            <Share2 size={20} /> Copy Profile Link
          </button>
          <p role="status">{notice}</p>
        </Sheet>
      )}
    </>
  );
}

export function ProfileScreen() {
  const { data, update } = useLocalData();
  const [sheet, setSheet] = useCaptureState<string | null>("community.sheet", null);
  const [name, setName] = useCaptureState("community.name", "");
  const [date, setDate] = useCaptureState("community.date", "");
  const [notice, setNotice] = useCaptureState("community.notice", "");
  return (
    <>
      <div className="profile-cover">
        {data.preferences.coverPhoto ? (
          <Image
            src={data.preferences.coverPhoto}
            alt="Your cover photo"
            width={900}
            height={450}
            unoptimized
            style={{
              objectFit: "cover",
              width: "100%",
              height: "100%",
              transform: `scale(${data.preferences.coverZoom || 1})`,
            }}
          />
        ) : data.preferences.coverChoice ? (
          <Photo crop={(coverChoices.find(c=>c.id===data.preferences.coverChoice)||coverChoices[0]).crop} alt="Selected cover" priority/>
        ) : data.preferences.profileWorkouts === "0" ? <div className="profile-default-cover"><FutureMark/></div> : (
          <Photo crop={media.ocean} alt="Ocean waves" priority />
        )}
      </div>
      <div className="profile-actions">
        <IconButton
          label="Share profile"
          onClick={() => setSheet("Share Profile")}
        >
          <Share2 />
        </IconButton>
        <Link
          className="icon-button"
          href="/profile/edit"
          aria-label="Edit profile"
        >
          <Pencil />
        </Link>
        <Link className="icon-button" href="/settings" aria-label="Settings">
          <Settings />
        </Link>
      </div>
      <div className="profile-identity">
        <Avatar person="alex" size={90} />
        <h1>{data.name}</h1>
        <p className="interested">
          Interested in <Link href="/profile/interests">#{data.interest || "add tags"}</Link>
        </p>
        <div className="profile-stats">
          <span>
            <small>Member Since</small>
            <b>{data.preferences.memberSince || "Jun 2026"}</b>
          </span>
          <span>
            <small>Workouts</small>
            <b>{data.preferences.profileWorkouts === "0" && !data.completed.length ? "--" : Number(data.preferences.profileWorkouts ?? 3) + data.completed.length}</b>
          </span>
          <span>
            <small>Lbs Lifted</small>
            <b>--</b>
          </span>
        </div>
      </div>
      <div className="profile-details">
        <section>
          <h2>Upcoming Event</h2>
          {!data.events.length && <p className="muted">Training for an upcoming event? Let your coach and friends know</p>}
          {data.events.map((e) => (
            <button
              className="event-card"
              key={e.id}
              onClick={() => {
                setName(e.name);
                setDate(e.date);
                setSheet("Event Details");
              }}
            >
              <span>{e.name}</span>
              <small>
                {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </small>
            </button>
          ))}
          <Link className="button" href="/profile/event">
            Add Event
          </Link>
          {data.preferences.profileWorkouts !== "0" && <><h2>Achievements</h2>
          <button
            className="achievement"
            aria-label="500 calorie achievement"
            onClick={() => setSheet("500 Calories")}
          >
            <Photo crop={media.achievement} alt="500 calories achievement" />
          </button></>}
        </section>
        <section>
          <h2>Your Coach</h2>
          <div className="row-group">
            <Row
              href="/coaches/lee"
              icon={<Avatar size={40} />}
              detail="Your personal coach"
            >
              Lee Owens
            </Row>
            <Row href="/coaches/change">Change Coach</Row>
          </div>
        </section>
      </div>
      {sheet === "500 Calories" && <AchievementDialog onClose={() => setSheet(null)} />}
      {sheet && sheet !== "500 Calories" && (
        <Sheet title={sheet} onClose={() => setSheet(null)}>
          {sheet === "Add Event" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update((s) => ({
                  events: [
                    ...s.events,
                    { id: crypto.randomUUID(), name: name.trim(), date },
                  ],
                }));
                setSheet(null);
              }}
            >
              <label className="form-field">
                Event name
                <input
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="form-field">
                Date
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <button className="button primary full">Add Event</button>
            </form>
          ) : sheet === "Event Details" ? (
            <>
              <CalendarDays />
              <h3>{name}</h3>
              <p>{date}</p>
            </>
          ) : sheet === "Share Profile" ? (
            <>
              <button
                className="button primary full"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    setNotice("Profile link copied.");
                  } catch {
                    setNotice("Copy the page address to share.");
                  }
                }}
              >
                Copy Profile Link
              </button>
              <p role="status">{notice}</p>
            </>
          ) : (
            <>
              <div className="achievement large">
                <Photo crop={media.achievement} alt="500 calories" />
              </div>
              <h3>500 Calories</h3>
              <p>Your achievement from the reference profile.</p>
            </>
          )}
        </Sheet>
      )}
    </>
  );
}
export function EditProfileScreen() {
  const { data } = useLocalData();
  return (
    <ProfileEditor
      key={`${data.name}-${data.interest}-${data.privateProfile}`}
    />
  );
}
function ProfileEditor() {
  const { data, update } = useLocalData();
  const router = useRouter();
  const [name, setName] = useCaptureState("community.name", data.name);
  const [interest, setInterest] = useCaptureState("community.interest", data.interest);
  const [privateProfile, setPrivateProfile] = useCaptureState("community.privateProfile", data.privateProfile);
  return (
    <>
      <PageHead title="Edit Profile" back="/profile" />
      <Link href="/profile/cover" className="button full">
        Edit Cover Photo
      </Link>
      <div className="edit-avatar">
        <Avatar person="alex" size={90} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({
            name: name.trim(),
            interest: interest.trim().replace(/^#/, ""),
            privateProfile,
          });
          router.push("/profile");
        }}
      >
        <label className="form-field">
          Name
          <input
            required
            minLength={2}
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="form-field">
          Interested in
          <input
            required
            maxLength={40}
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
          />
        </label>
        <Link className="row" href="/profile/interests">
          Add interests
        </Link>
        <label className="switch-row">
          Private Profile
          <input
            type="checkbox"
            checked={privateProfile}
            onChange={(e) => setPrivateProfile(e.target.checked)}
          />
        </label>
        <p className="note">Changes are saved on this device.</p>
        <button className="button primary full">Save Profile</button>
      </form>
    </>
  );
}
