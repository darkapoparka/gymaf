"use client";
import { useCaptureState } from "@/lib/capture-context";
import Link from "./capture-link";
import { useAppRouter as useRouter } from "./capture-link";
import {
  Star,
  ChevronDown,
  ChevronRight,
  Settings,
  Play,
  List,
  Check,
  X,
  Search,
  Dumbbell,
  Clock3,
  Flame,
} from "lucide-react";
import { media, activities, type Workout } from "@/lib/data";
import { useLocalData } from "@/lib/store";
import { useBackend, useWorkoutCatalog } from "@/lib/backend/context";
import {
  Back,
  IconButton,
  PageHead,
  Photo,
  Row,
  Sheet,
  Tabs,
} from "./primitives";

export function WorkoutTile({ workout }: { workout: Workout }) {
  const { data, update } = useLocalData();
  const favorite = data.favorites.includes(workout.id);
  return (
    <article className="workout-tile">
      <Link href={"/workouts/" + workout.id}>
        <Photo crop={workout.image} alt={workout.title} />
        <h3>{workout.title}</h3>
        <p>
          {workout.minutes} min · {workout.intensity}
        </p>
      </Link>
      <button
        type="button"
        className={"favorite " + (favorite ? "is-favorite" : "")}
        aria-label={(favorite ? "Unfavorite " : "Favorite ") + workout.title}
        aria-pressed={favorite}
        onClick={() =>
          update((s) => ({
            favorites: favorite
              ? s.favorites.filter((x) => x !== workout.id)
              : [...s.favorites, workout.id],
          }))
        }
      >
        <Star size={22} fill={favorite ? "currentColor" : "none"} />
      </button>
    </article>
  );
}

export function WorkoutsScreen({
  all = false,
  activity,
}: {
  all?: boolean;
  activity?: string;
}) {
  const [tab, setTab] = useCaptureState("workouts.tab", activity ? "Just Work Out" : "Future Picks");
  const [search, setSearch] = useCaptureState("workouts.search", activity ?? "");
  const [searchOpen, setSearchOpen] = useCaptureState("workouts.searchOpen", false);
  const [duration, setDuration] = useCaptureState("workouts.duration", "All");
  const [intensity, setIntensity] = useCaptureState("workouts.intensity", "All");
  const [equipment, setEquipment] = useCaptureState("workouts.equipment", "All");
  const [filter, setFilter] = useCaptureState<string | null>("workouts.filter", null);
  const [favoritesOnly, setFavoritesOnly] = useCaptureState("workouts.favoritesOnly", false);
  const { data } = useLocalData();
  const catalog = useWorkoutCatalog();
  const backend = useBackend();
  const list = catalog
    .filter(
      (w) =>
        !["bodyweight-beach", "running"].includes(w.id) &&
        w.category !== "Activity",
    )
    .filter(
      (w) =>
        w.title.toLowerCase().includes(search.toLowerCase()) &&
        (duration === "All" ||
          (duration === "Quick"
            ? w.minutes <= 30
            : duration === "Standard"
              ? w.minutes > 30 && w.minutes <= 45
              : w.minutes > 45)) &&
        (intensity === "All" || w.intensity === intensity) &&
        (equipment === "All" ||
          (equipment === "No equipment"
            ? w.equipment === "No Equipment Required"
            : w.equipment === "Dumbbells")) &&
        (!(favoritesOnly || backend && tab === 'Favorites') || data.favorites.includes(w.id)),
    );
  return (
    <>
      {all ? (
        <PageHead title={backend?'Your Workouts':'Future Picks'} back="/workouts">
          <IconButton
            label="Search workouts"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search size={20} />
          </IconButton>
        </PageHead>
      ) : (
        <header className="library-head">
          <Link
            className="icon-button"
            href="/"
            aria-label="Close More Workouts"
          >
            <X size={28} />
          </Link>
          <h1>More Workouts</h1>
        </header>
      )}
      {!all && (
        <Tabs
          items={backend ? ['Your Workouts','Favorites'] : ["Future Picks", "Just Work Out"]}
          value={backend && tab === 'Future Picks' ? 'Your Workouts' : tab}
          onChange={setTab}
        />
      )}
      <div className="workout-content">
        {backend || tab === "Future Picks" ? (
          <>
            {all && (
              <div className="filter-row">
                <button onClick={() => setFilter("Duration")}>
                  <Clock3 size={15} />
                  {duration === "All" ? "Duration" : duration}
                  <ChevronDown size={16} />
                </button>
                <button onClick={() => setFilter("Equipment")}>
                  <Dumbbell size={15} />
                  Equipment
                  <ChevronDown size={16} />
                </button>
                <button onClick={() => setFilter("Intensity")}>
                  <Flame size={15} />
                  {intensity === "All" ? "Intensity" : intensity}
                  <ChevronDown size={16} />
                </button>
              </div>
            )}
            {(backend || searchOpen) && (
              <div className="search-row">
                <label className="search-field">
                  <Search size={18} />
                  <input
                    aria-label="Search workouts"
                    placeholder="Search workouts"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <X size={15} />
                    </button>
                  )}
                </label>
                <button
                  className={"icon-button " + (favoritesOnly ? "chosen" : "")}
                  aria-label="Show favorites"
                  aria-pressed={favoritesOnly}
                  onClick={() => setFavoritesOnly(!favoritesOnly)}
                >
                  <Star size={21} />
                </button>
              </div>
            )}
            {!all && (
              <div className="section-intro">
                <h2>{backend ? "Your workouts" : "Future Picks"}</h2>
                <p>{backend ? "Assigned by your coach" : "The best from across Future"}</p>
              </div>
            )}
            <div className="workout-grid">
              {list.slice(0, all ? list.length : 4).map((w) => (
                <WorkoutTile key={w.id} workout={w} />
              ))}
            </div>
            {list.length === 0 && (
              <div className="empty-state">
                <h2>No workouts found</h2>
                <p>Try another search or clear your filters.</p>
                <button
                  className="button"
                  onClick={() => {
                    setSearch("");
                    setDuration("All");
                    setEquipment("All");
                    setIntensity("All");
                    setFavoritesOnly(false);
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
            {!all && list.length > 4 && (
              <Link className="button" href="/workouts/picks">
                View All
              </Link>
            )}
          </>
        ) : (
          <>
            <label className="search-field">
              <Search size={18} />
              <input
                aria-label="Search activities"
                placeholder="Search Activities"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <h2>Just Work Out</h2>
            <p>Track all your activities in real time</p>
            <div className="activity-grid">
              {activities
                .filter(
                  (n) =>
                    n.toLowerCase().includes(search.toLowerCase()) ||
                    (search === "Hiking" && n === "Hike"),
                )
                .map((n) => (
                  <Link key={n} href={`/workouts/${n.toLowerCase()}`}>
                    <span className="activity-symbol">
                      <Dumbbell size={42} />
                    </span>
                    <h3>{n}</h3>
                  </Link>
                ))}
            </div>
            {!activities.some((n) =>
              n.toLowerCase().includes(search.toLowerCase()),
            ) && <p>No matching activities.</p>}
          </>
        )}
      </div>
      {filter && (
        <Sheet title={filter} onClose={() => setFilter(null)}>
          <div className="choice-list">
            {(filter === "Duration"
              ? ["All", "Quick", "Standard", "Long"]
              : filter === "Equipment"
                ? ["All", "No equipment", "Dumbbells"]
                : ["All", "Low", "Moderate", "Intense"]
            ).map((v) => (
              <button
                key={v}
                className="row"
                onClick={() => {
                  if (filter === "Duration") setDuration(v);
                  if (filter === "Equipment") setEquipment(v);
                  if (filter === "Intensity") setIntensity(v);
                  setFilter(null);
                }}
              >
                {v}
                {(filter === "Duration"
                  ? duration
                  : filter === "Equipment"
                    ? equipment
                    : intensity) === v && <Check size={19} />}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </>
  );
}

export function WorkoutDetail({ workout: w }: { workout: Workout }) {
  const { data, update } = useLocalData();
  const [sheet, setSheet] = useCaptureState<string | null>("workouts.sheet", null);
  const favorite = data.favorites.includes(w.id);
  const router = useRouter();
  return (
    <div
      className={"workout-detail " + (w.id === "running" ? "run-detail" : "")}
    >
      <div className="workout-backdrop">
        <Photo
          crop={
            w.id === "bodyweight-beach"
              ? { ...media.home, y: 515, h: 562 }
              : w.image
          }
          alt={w.title}
          priority
        />
      </div>
      <div className="detail-top">
        <Back />
        <div>
          <IconButton
            label="Workout settings"
            onClick={() => {
              update((s) => ({
                preferences: {
                  ...s.preferences,
                  workoutReturn: "/workouts/" + w.id,
                },
              }));
              router.push("/settings/workout");
            }}
          >
            <Settings />
          </IconButton>
          <IconButton
            label={favorite ? "Unfavorite workout" : "Favorite workout"}
            onClick={() =>
              update({
                favorites: favorite
                  ? data.favorites.filter((id) => id !== w.id)
                  : [...data.favorites, w.id],
              })
            }
          >
            <Star fill={favorite ? "currentColor" : "none"} />
          </IconButton>
        </div>
      </div>
      <div className="detail-title">
        {w.id === "running" && <p>Today’s Workout</p>}
        <h1>{w.title}</h1>
        {w.id !== "running" && (
          <p>
            <Dumbbell size={20} />
            {w.category}
          </p>
        )}
      </div>
      <div className="detail-bottom">
        <button
          className="equipment-panel"
          onClick={() => setSheet("Equipment")}
        >
          <span>
            {w.minutes} min<small>{w.equipment}</small>
          </span>
          <ChevronRight />
        </button>
        {w.id === "running" && (
          <button
            className="button full"
            onClick={() => setSheet("Mark Complete")}
          >
            Mark Complete
          </button>
        )}
        <div className="start-row">
          <IconButton
            label="Workout overview"
            onClick={() => setSheet("Workout Overview")}
          >
            <List />
          </IconButton>
          <Link
            className="button primary"
            href={"/workouts/" + w.id + "/session"}
          >
            <Play size={22} fill="currentColor" /> Start
            {w.id === "running" ? " Workout" : ""}
          </Link>
        </div>
      </div>
      {sheet && (
        <Sheet title={sheet} onClose={() => setSheet(null)}>
          {sheet === "Mark Complete" ? (
            <>
              <h2>Did you finish your workout?</h2>
              <button
                className="button primary full"
                onClick={() => {
                  update((s) => ({
                    completed: [...new Set([...s.completed, w.id])],
                  }));
                  router.push("/workouts/" + w.id + "/summary");
                }}
              >
                Yes
              </button>
              <button className="button full" onClick={() => setSheet(null)}>
                Cancel
              </button>
            </>
          ) : sheet === "Equipment" ? (
            <>
              <Dumbbell size={36} />
              <h3>{w.equipment}</h3>
              <p>
                {w.minutes} min · {w.category}
              </p>
            </>
          ) : sheet === "Workout Settings" ? (
            <div className="row-group">
              {[
                "Exercise Instructions",
                "Workout Tones",
                "Heart Rate Zones",
              ].map((label) => (
                <label className="switch-row" key={label}>
                  {label}
                  <input
                    type="checkbox"
                    defaultChecked={label !== "Heart Rate Zones"}
                  />
                </label>
              ))}
              <p className="note">
                Preferences apply to this local workout preview.
              </p>
            </div>
          ) : (
            <div className="row-group">
              {(w.prescription ? w.prescription.exercises.map(e => e.name) : w.category === "Flexibility"
                ? ["Breathing", "Cat-Cow", "Downward Dog", "Chaturanga"]
                : [
                    "Warm Up",
                    "Bodyweight Squat",
                    "Push Up",
                    "Glute Bridge",
                    "Cool Down",
                  ]
              ).map((e, i) => (
                <Row
                  key={e}
                  detail={w.prescription ? `${w.prescription.exercises[i].sets.length} ${w.prescription.exercises[i].sets.length === 1 ? 'set' : 'sets'}` : i === 0 ? "Warm up" : "3 rounds"}
                  onClick={() => setSheet(null)}
                >
                  {e}
                </Row>
              ))}
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}

export { WorkoutSession } from "./workout-session";

export { SummaryScreen } from "./workout-summary";
