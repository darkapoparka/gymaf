"use client";
import { useCapture, useCaptureState } from "@/lib/capture-context";
import Image from "next/image";
import { useEffect } from "react";
import Link from "./capture-link";
import { useAppRouter as useRouter } from "./capture-link";
import { ArrowRight, Bell, ChevronLeft, Heart, Search, QrCode, X } from "lucide-react";
import { commercialGymEquipment } from "@/lib/equipment";
import { coachCrops } from "@/lib/reference-crops";
import { GuestQR } from "./guest-qr";
import { Avatar, Photo, Sheet } from "./primitives";
import {
  Chips,
  Choices,
  Fields,
  FlowFooter,
  FlowHead,
  FlowRow,
  usePreferences,
} from "./flow-primitives";

const goals = [
  "Lose weight",
  "Get toned",
  "Increase muscle mass",
  "Improve health and wellness",
  "Improve sports performance",
  "I’m not sure",
];
const qualities = [
  "High-energy",
  "Knows when to give me tough love",
  "Calm, cool, and collected",
  "Always positive",
  "Drill sergeant",
  "Has a sense of humor",
  "Analytical and results-driven",
  "Strictly business",
];
const expertise = [
  "Sports Performance",
  "General Strength Training",
  "Nutrition",
  "Bodybuilding",
  "Weight Loss",
  "Adaptive Exercise",
  "Orthopedic Limitations",
  "Injury Prevention",
  "Tactical Performance",
  "Sports Psychology",
  "Olympic Weightlifting",
  "Powerlifting",
  "Running",
  "Kettlebells",
  "Prenatal and Postpartum",
  "Hiking",
  "Crossfit",
  "Combat Sports",
  "Triathlon",
  "Metabolic Syndromes and Heart Conditions",
  "Yoga",
  "Cycling",
  "Swimming",
  "Gymnastics",
  "Rowing",
  "Pilates and Barre",
  "Dance",
  "Obstacle Races",
];
const activityGroups = {
  "Strength & Resistance Training": [
    "Weight Training",
    "Strength Training",
    "Resistance Training",
    "CrossFit",
    "Gymnastics",
    "Personal Training",
  ],
  "Cardio & Endurance": [
    "HIIT",
    "Walking",
    "Running",
    "Elliptical",
    "Jump Rope",
    "Swimming",
  ],
  "Combat & Martial Arts": ["Boxing", "Kickboxing", "Martial Arts"],
};
export const coachPortrait = {
  src: "screens/8dae96b34ae39b84.webp",
  sw: 1179,
  sh: 2676,
  x: 0,
  y: 390,
  w: 1179,
  h: 820,
};
const initialActivities = ["CrossFit", "Strength Training"];

export function OnboardingScreen({ path }: { path: string }) {
  const router = useRouter();
  const capture = useCapture();
  const { get, set, setMany, data, update } = usePreferences();
  const [sheet, setSheet] = useCaptureState<string | null>("onboarding.sheet", null);
  const [query, setQuery] = useCaptureState("onboarding.query", "");
  const [sort, setSort] = useCaptureState("onboarding.sort", "Popularity");
  const [contact, setContact] = useCaptureState("onboarding.contact", "");
  const [notice, setNotice] = useCaptureState("onboarding.notice", "");
  const [coachPage, setCoachPage] = useCaptureState("onboarding.coachPage", 0);
  const selectedQualities = JSON.parse(get("coachQualities", "[]")) as string[];
  const selectedExpertise = JSON.parse(get("coachExpertise", "[]")) as string[];
  const selectedActivities = JSON.parse(
    get("activities", JSON.stringify(initialActivities)),
  ) as string[];
  function toggle(key: string, item: string, selection: string[]) {
    set(
      key,
      JSON.stringify(
        selection.includes(item)
          ? selection.filter((i) => i !== item)
          : [...selection, item],
      ),
    );
  }
  const isContact = [
    "onboarding/contact",
    "onboarding/email",
    "login",
    "login/email",
  ].includes(path);
  const isEmail = path.endsWith("email");
  const isLogin = path.startsWith("login");
  useEffect(() => {
    if (capture) return;
    if (path !== "onboarding/matching" && path !== "login/signing-in") return;
    const timer = setTimeout(
      () => router.replace(path === "onboarding/matching" ? "/coaches" : "/"),
      1200,
    );
    return () => clearTimeout(timer);
  }, [path, router, capture]);

  if (isContact || path === "onboarding/coach" || path === "login/sent")
    return (
      <div className={"contact-flow " + (isEmail ? "email-contact " : "") + (path === "onboarding/coach" ? "choose-coach-contact" : "")}>
        <Photo
          crop={{
            src: "welcome.webp",
            sw: 720,
            sh: 1680,
            x: 0,
            y: 184,
            w: 720,
            h: 876,
          }}
          className="contact-background"
        />
        <header>
          <Link href="/welcome" className="icon-button" aria-label="Close">
            <X />
          </Link>
          <span className="auth-wordmark">
            future<span>Pro</span>
          </span>
        </header>
        {isContact ? (
          <>
            <h1>
              Enter your {isEmail ? "email" : "phone number"}<br/>to get started.
            </h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                set("contact", contact);
                router.push(isLogin ? "/login/sent" : "/onboarding/coach");
              }}
            >
              <input
                autoFocus
                aria-label={isEmail ? "Email" : "Phone Number"}
                placeholder={isEmail ? "Email" : "Phone Number"}
                type={isEmail ? "email" : "tel"}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                minLength={isEmail ? 5 : 6}
              />
              <div className="contact-methods"><button type="button" className="icon-button" aria-label="Continue on another device" onClick={()=>setSheet("Continue on another device")}><QrCode size={20}/></button><Link
                className="button"
                href={
                  isEmail
                    ? isLogin
                      ? "/login"
                      : "/onboarding/contact"
                    : isLogin
                      ? "/login/email"
                      : "/onboarding/email"
                }
              >
                Use {isEmail ? "Phone" : "Email"} Instead
              </Link></div>
              <button
                className="button primary full"
                disabled={contact.trim().length < 5}
              >
                Continue
              </button>
            </form>
          </>
        ) : path === "login/sent" ? (
          <>
            <h1>Check your email.</h1>
            <p>
              A sign-in link for {get("contact", "your email")} would appear
              here.
            </p>
            <p className="note">
              Email delivery is not connected in this local preview.
            </p>
            <Link className="button primary full" href="/login/signing-in">
              Preview Sign In
            </Link>
          </>
        ) : (
          <>
            <h1>Select your coach now to begin your Future fitness journey.</h1>
            <Link className="button primary full" href="/onboarding/goal">
              Find Your Coach
            </Link>
            <Link href="/onboarding/contact">
              Try another phone number or email
            </Link>
          </>
        )}
        <p className="auth-terms">
          By continuing you agree to Future’s{" "}
          <button onClick={() => setSheet("Terms & Conditions")}>
            Terms & Conditions
          </button>{" "}
          and{" "}
          <button onClick={() => setSheet("Privacy Policy")}>
            Privacy Policy
          </button>
          .
        </p>
        {sheet && (
          <Sheet title={sheet} onClose={() => setSheet(null)}>
            {sheet === "Continue on another device" ? <GuestQR label="QR code to open this page on another device" url={typeof window === "undefined" ? "" : window.location.href} /> : <p>
              This local interface preview does not create a Future account or
              enter a membership agreement.
            </p>}
          </Sheet>
        )}
      </div>
    );

  if (
    [
      "onboarding/goal",
      "onboarding/style",
      "onboarding/intensity",
      "onboarding/matching",
      "login/signing-in",
    ].includes(path)
  ) {
    const step = path.split("/").at(-1);
    const progress = step === "goal" ? 20 : step === "style" ? 55 : 85;
    return (
      <div className="coach-quiz">
        <div className="quiz-brand" aria-hidden="true">
          <Image src="/brand/emblem-flat.svg" alt="" width={814} height={1117} />
        </div>
        {step === "matching" || path === "login/signing-in" ? (
          <div className="matching-state" role="status">
            <span className="loading-ring" />
            <h2>
              {path === "login/signing-in" ? "Signing In" : "Just a moment"}
            </h2>
            {path !== "login/signing-in" && (
              <p>We’re using your answers to fit you with the perfect coach.</p>
            )}
          </div>
        ) : (
          <>
            <header>
              <Link
                href={
                  step === "goal"
                    ? "/onboarding/coach"
                    : step === "style"
                      ? "/onboarding/goal"
                      : "/onboarding/style"
                }
                className="icon-button"
                aria-label="Back"
              >
                <ChevronLeft />
              </Link>
              <div className="quiz-progress">
                <span style={{ width: progress + "%" }} />
              </div>
            </header>
            <h1>
              {step === "goal"
                ? "What’s your top fitness goal?"
                : step === "style"
                  ? "How would you describe your ideal coach?"
                  : "What level of intensity do you want from your coach?"}
            </h1>
            {step === "style" && <p>Choose all that apply.</p>}
            {step === "goal" ? (
              <Choices
                items={goals}
                value={get("fitnessGoal")}
                onChange={(v) => {
                  set("fitnessGoal", v);
                  router.push("/onboarding/style");
                }}
              />
            ) : step === "style" ? (
              <Choices
                multiple
                items={qualities}
                value={selectedQualities}
                onChange={(v) => toggle("coachQualities", v, selectedQualities)}
              />
            ) : (
              <div className="intensity-slider">
                <output>
                  {
                    [
                      "Not intense",
                      "A little intense",
                      "Sometimes intense",
                      "Very intense",
                      "Extremely intense",
                    ][Number(get("coachIntensity", "2"))]
                  }
                </output>
                <input
                  aria-label="Coach intensity"
                  type="range"
                  min="0"
                  max="4"
                  value={get("coachIntensity", "2")}
                  onChange={(e) => set("coachIntensity", e.target.value)}
                />
                <div>
                  <span>Not intense</span>
                  <span>Extremely intense</span>
                </div>
              </div>
            )}
            {step !== "goal" && (
              <Link
                className="quiz-next"
                href={
                  step === "style"
                    ? "/onboarding/intensity"
                    : "/onboarding/matching"
                }
              >
                NEXT <ArrowRight size={18} />
              </Link>
            )}
          </>
        )}
      </div>
    );
  }
  if (path === "coaches" || path === "coaches/lee")
    return (
      <div className="coach-world">
        <FlowHead
          title={path === "coaches" ? "Recommended Coaches" : "Lee"}
          back={path === "coaches" ? "/onboarding/intensity" : "/coaches"}
          close={path === "coaches"}
        />
        {path === "coaches" ? (
          <>
            <div className="coach-photo-stage"><Photo crop={coachPortrait} className="coach-hero" priority />
              <Photo crop={{...coachPortrait, y: 1210, w: 96, h: 420}} className="coach-photo-side left"/>
              <Photo crop={{...coachPortrait, x:1083, y:1210, w:96, h:420}} className="coach-photo-side right"/>
            </div>
            {coachPage < 3 ? (
              <article className="recommendation">
                <div>TOP RECOMMENDATION</div>
                <h2>Lee</h2>
                <p>
                  Previously: Head Strength + Conditioning Coach for a Fitness
                  Club
                </p>
                <Link href="/coaches/lee">LEARN MORE</Link>
              </article>
            ) : (
              <article className="recommendation">
                <h2>Want more options?</h2>
                <p>
                  We have more coaches that you may find are a better fit for
                  what you’re looking to get out of Future Pro.
                </p>
                <Link href="/coaches/search">View More Coaches</Link>
              </article>
            )}
            <div className="coach-pagination">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  aria-label={`Recommendation ${n + 1}`}
                  aria-pressed={n === coachPage}
                  onClick={() => setCoachPage(n)}
                />
              ))}
            </div>
            <div className="coach-cta">
              <Link href="/checkout" className="button primary full">
                Train with Lee
              </Link>
              <Link href="/coaches/search">View More Coaches</Link>
            </div>
          </>
        ) : (
          <>
            <Photo crop={coachPortrait} className="coach-detail-image" />
            <h2>Lee Owens</h2>
            <section className="coach-bio">
              <h3>SPECIALTIES</h3>
              <Chips
                items={[
                  "Sports Performance",
                  "General Strength Training",
                  "Kettlebells",
                ]}
                selected={[]}
                onChange={() => router.push("/coaches/search")}
              />
              <h3>ABOUT</h3>
              <p>
                Lee focuses on personalized programs that fit each client’s
                lifestyle while building strength and improving performance.
              </p>
              <p>
                With over 8 years of coaching clients from all walks of life,
                Lee is dedicated to helping clients unlock their potential with
                results-driven strategies and consistent support, no matter
                where they start.
              </p>
              <p>
                Outside of the gym, Lee unwinds + stays active by walking his
                two Goldendoodles and playing basketball.
              </p>
              <h3>CERTIFIED</h3>
              <p>
                B.S. Exercise Science
                <br />
                Functional Range Conditioning (FRS)
              </p>
              <h3>LOVES</h3>
              <p>
                Walking his Two Goldendoodles
                <br />
                Playing Basketball
                <br />
                All Things Philadelphia Sports
              </p>
              <h3>LOCATED</h3>
              <p>
                Currently: Scranton, PA
                <br />
                Originally: Scranton, PA
              </p>
            </section>
            <div className="sticky-flow-action">
              <Link className="button primary full" href="/checkout">
                Train with Lee
              </Link>
            </div>
          </>
        )}
      </div>
    );
  if (path === "coaches/search" || path === "coaches/results")
    return (
      <div className="coach-search">
        <FlowHead
          title="Find Your Coach"
          back="/coaches"
          close
          action={
            path.endsWith("results") ? (
              <Link href="/coaches/search">Edit</Link>
            ) : null
          }
        />
        {path.endsWith("search") ? (
          <>
            <div className="search-toolbar">
              <button onClick={() => set("coachExpertise", "[]")}>
                Clear All
              </button>
              <label>
                Sort{" "}
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option>Popularity</option>
                  <option>A–Z</option>
                </select>
              </label>
            </div>
            <h2>EXPERTISE</h2>
            <Chips
              items={sort === "A–Z" ? [...expertise].sort() : expertise}
              selected={selectedExpertise}
              onChange={(v) => toggle("coachExpertise", v, selectedExpertise)}
            />
            <h2>COACHING STYLE</h2>
            <Chips
              items={[
                "Detail Oriented",
                "Even Keeled",
                "High Energy",
                "Laid Back",
                "Motivating",
                "Results Oriented",
                "Supportive",
              ]}
              selected={selectedExpertise}
              onChange={(v) => toggle("coachExpertise", v, selectedExpertise)}
            />
            <h2>SPORTS</h2>
            <Chips
              items={["Basketball", "Football", "Soccer", "Baseball"]}
              selected={selectedExpertise}
              onChange={(v) => toggle("coachExpertise", v, selectedExpertise)}
            />
            <div className="sticky-flow-action">
              <Link className="button primary full" href="/coaches/results">
                Show Coaches ({selectedExpertise.length ? 94 : 108})
              </Link>
            </div>
          </>
        ) : (
          <>
            <label className="search-field">
              <Search size={18} />
              <input
                placeholder="Search coaches"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <Chips
              items={selectedExpertise}
              selected={selectedExpertise}
              onChange={(v) => toggle("coachExpertise", v, selectedExpertise)}
            />
            {[
              ["Aarif", "Previously: D1 Wrestling Champion."],
              ["Adam", "Past experience: Personal trainer and CrossFit coach"],
              [
                "Alex",
                "Past experience: Certified personal trainer specializing in strength and conditioning",
              ],
              [
                "Alyssa",
                "Previously: Performance coach with EXOS, one of the world’s top gyms.",
              ],
              ["Amber", "Previously: Head coach at Orangetheory Fitness."],
              [
                "Amberly",
                "Previously: U.S.A. swim coach for an elite swim club.",
              ],
              ["Lee", "Head Strength + Conditioning Coach for a Fitness Club"],
            ]
              .filter((c) =>
                c.join(" ").toLowerCase().includes(query.toLowerCase()),
              )
              .map(([name, bio]) => (
                <button
                  key={name}
                  className="coach-result"
                  onClick={() =>
                    name === "Lee"
                      ? router.push("/coaches/lee")
                      : setSheet(name)
                  }
                >
                  <span className="coach-initial">{coachCrops[name]?<Photo crop={coachCrops[name]} alt={name}/>:<Avatar size={60}/>}</span>
                  <span>
                    <strong>{name}</strong>
                    <small>{bio}</small>
                  </span>
                  <ChevronLeft
                    style={{ transform: "rotate(180deg)" }}
                    size={18}
                  />
                </button>
              ))}
            {sheet && (
              <Sheet title={sheet} onClose={() => setSheet(null)}>
                <p>
                  The reference contains Lee’s detailed profile. Explore his
                  coaching specialties and background.
                </p>
                <Link className="button primary" href="/coaches/lee">
                  View Lee
                </Link>
              </Sheet>
            )}
          </>
        )}
      </div>
    );
  if (path === "checkout" || path === "checkout/card")
    return (
      <div className={path === "checkout" ? "checkout-world" : "flow-page"}>
        <FlowHead
          title={path.endsWith("card") ? "Pay with Credit Card" : "Checkout"}
          back={path.endsWith("card") ? "/checkout" : "/coaches"}
        />
        {path === "checkout" ? (
          <>
            <Photo crop={coachPortrait} className="checkout-portrait" />
            <div className="checkout-coach">
              <h1>Lee</h1>
              <p>Unlimited 1-on-1 Coaching & Expertise</p>
            </div>
            <article className="checkout-price">
              <div>
                <strong>Membership</strong>
                <span>
                  <s>$199</s> $50
                </span>
              </div>
              <p>$50 first month – $199/mo afterwards.</p>
              <div>
                <small>TODAY’S TOTAL</small>
                <strong>$50</strong>
              </div>
            </article>
            <p className="checkout-guarantee">
              All subscriptions come with a 30-day risk free guarantee.
            </p>
            <button onClick={() => setSheet("FAQ")}>FAQ</button>
            <div className="checkout-links">
              <button onClick={() => setSheet("Terms of Use")}>
                Terms of Use
              </button>
              <button onClick={() => setSheet("Privacy Policy")}>
                Privacy Policy
              </button>
            </div>
            <button
              className="button primary full"
              onClick={() => setSheet("Apple Pay")}
            >
              Subscribe with Apple Pay
            </button>
            <Link className="button full" href="/checkout/card">
              Subscribe with Card
            </Link>
            {sheet && (
              <Sheet title={sheet} onClose={() => setSheet(null)}>
                <p>
                  This is the reference checkout. Payments and memberships are
                  not connected, and no charge will be made.
                </p>
                <Link
                  className="button primary full"
                  href="/onboarding/welcome"
                >
                  Preview Next Screen
                </Link>
              </Sheet>
            )}
          </>
        ) : (
          <Fields
            key="card"
            fields={[
              {
                key: "firstName",
                label: "First Name",
                required: true,
                value: "Alex",
              },
              {
                key: "lastName",
                label: "Last Name",
                required: true,
                value: "Smith",
              },
              { key: "email", label: "Email", type: "email", required: true },
              { key: "phone", label: "Phone Number", type: "tel" },
              {
                key: "card",
                label: "Credit Card",
                placeholder: "Test card only",
              },
              { key: "expiry", label: "MM/YY" },
              { key: "cvc", label: "CVC" },
              { key: "address", label: "Address" },
              { key: "apt", label: "Apt, suite, etc. (Optional)" },
              { key: "city", label: "City" },
              { key: "state", label: "State" },
              { key: "zip", label: "Zip Code" },
            ]}
            label="Preview Subscription"
            onSave={() => router.push("/onboarding/welcome")}
          >
            <p className="note">
              Local checkout preview. No payment is processed or card
              information stored.
            </p>
          </Fields>
        )}
      </div>
    );
  if (path === "onboarding/welcome")
    return (
      <div className="join-welcome">
        <Photo crop={coachPortrait} priority />
        <h1>
          Welcome,
          <br />
          {data.name.split(" ")[0]}
        </h1>
        <p>Coach Lee is excited to work with you.</p>
        <Link href="/onboarding/booking" className="button primary full">
          Let’s Start
        </Link>
      </div>
    );
  if (path === "onboarding/booking" || path === "appointments")
    return (
      <div className="setup-flow booking-flow">
        <h1>Book your kickoff call with {get("selectedCoach", "Lee")}.</h1>
        <p className="setup-description">
          This 30 minute one-on-one call is key to laying a strong foundation
          for your training.
        </p>
        <div className="booking-dates">
          {["Mon 29", "Tue 30", "Wed 1", "Thu 2", "Mon 6", "Tue 7"].map(
            (day) => (
              <button
                key={day}
                className={
                  get("appointmentDay", "Mon 29") === day ? "selected" : ""
                }
                onClick={() => {
                  set("appointmentDay", day);
                  set("appointmentTime", "");
                }}
              >
                {day.split(" ")[0]}
                <strong>{day.split(" ")[1]}</strong>
              </button>
            ),
          )}
        </div>
        <div className="booking-times">
          {(capture?.ui["booking.times"] as string[] || [
            "8:00 PM",
            "8:15 PM",
            "8:30 PM",
            "8:45 PM",
            "9:00 PM",
            "9:15 PM",
            "9:30 PM",
            "9:45 PM",
            "10:00 PM",
            "10:15 PM",
          ]).map((time) => (
            <button
              key={time}
              className={get("appointmentTime") === time ? "selected" : ""}
              onClick={() => set("appointmentTime", time)}
            >
              {time}
            </button>
          ))}
        </div>
        <button
          className="button full"
          onClick={() => setSheet("Find another time")}
        >
          None of these times work for me
        </button>
        <FlowFooter
          back={path === "appointments" ? "/" : "/onboarding/welcome"}
          next={path === "appointments" ? "/" : "/onboarding/health"}
          label={
            get("appointmentTime")
              ? `Book ${get("appointmentDay", "Mon 29")} at ${get("appointmentTime")}`
              : "Continue"
          }
          disabled={!get("appointmentTime")}
          onNext={() => set("appointmentBooked", "true")}
        />
        {sheet && (
          <Sheet title={sheet} onClose={() => setSheet(null)}>
            <Fields
              fields={[
                {
                  key: "appointmentRequest",
                  label: "What times work for you?",
                  type: "textarea",
                  required: true,
                },
              ]}
              label="Save Request"
              onSave={(v) => {
                setMany(v);
                setSheet(null);
                setNotice("Your availability is saved locally.");
              }}
            />
          </Sheet>
        )}
        {notice && <p role="status">{notice}</p>}
      </div>
    );
  const step = path.split("/").at(-1);
  const order = [
    "booking",
    "health",
    "details",
    "activities",
    "setup",
    "injuries",
    "notes",
    "notifications",
  ];
  const idx = order.indexOf(step ?? "");
  const prev = "/onboarding/" + order[Math.max(0, idx - 1)];
  const next = idx === order.length - 1 ? "/" : "/onboarding/" + order[idx + 1];
  const titles: Record<string, string> = {
    health: "Connect to Apple Health",
    details: "Confirm your details.",
    activities: "How do you like to stay active?",
    setup: "Share your workout setup.",
    injuries: "Do you have any injuries or limitations?",
    notes: "Anything else?",
    notifications: "Turn on notifications",
  };
  const coachNotes: Record<string, string> = {
    details: "I use these to calculate calorie burn and heart rate zones.",
    activities: "I’ll try to work these into your plan!",
    setup: "This will form the foundation for your weekly workout schedule.",
    injuries:
      "Let me know about anything that has a big impact on your movements.",
    notes:
      "Anything else I should know? The more you share, the more I can tailor your plan.",
  };
  return (
    <div className={"setup-flow setup-" + step}>
      <h1>{titles[step ?? ""]}</h1>
      {coachNotes[step ?? ""] && (
        <div className="setup-coach">
          <Avatar size={42} />
          <div>
            <b>Lee</b>
            <p>{coachNotes[step ?? ""]}</p>
          </div>
        </div>
      )}
      {step === "health" ? (
        <div className="permission-intro">
          <Heart size={86} fill="#fa486b" stroke="#fa486b" />
          <p>Track progress to see how workouts impact your health.</p>
          <p className="note">
            Apple Health is a native iOS connection. Continue to preview the
            setup.
          </p>
        </div>
      ) : step === "details" ? (
        <Fields
          fields={[
            {
              key: "sex",
              label: "Biological Sex",
              options: ["Male", "Female", "Not specified"],
            },
            {
              key: "dob",
              label: "Date of Birth",
              type: "date",
              value: "1998-02-18",
            },
            { key: "height", label: "Height", type: "number", value: "175" },
            {
              key: "bodyWeight",
              label: "Weight (lbs)",
              type: "number",
              value: "154",
            },
          ]}
          onSave={(v) => {
            setMany(v);
            router.push(next);
          }}
          label="Continue"
        />
      ) : step === "activities" ? (
        <>
          <h2>Your activities</h2>
          <Chips
            items={selectedActivities}
            selected={selectedActivities}
            onChange={(v) => toggle("activities", v, selectedActivities)}
          />
          <label className="search-field">
            <Search size={18} />
            <input
              placeholder="Search or Add Activity"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <h2>Popular activities</h2>
          {Object.entries(activityGroups).map(([title, items]) => (
            <section key={title}>
              <h3>{title}</h3>
              <Chips
                items={items.filter((i) =>
                  i.toLowerCase().includes(query.toLowerCase()),
                )}
                selected={selectedActivities}
                onChange={(v) => toggle("activities", v, selectedActivities)}
              />
            </section>
          ))}
          {query &&
            !Object.values(activityGroups)
              .flat()
              .some((a) => a.toLowerCase() === query.toLowerCase()) && (
              <button
                className="button"
                onClick={() => {
                  toggle("activities", query, selectedActivities);
                  setQuery("");
                }}
              >
                Add {query}
              </button>
            )}
        </>
      ) : step === "setup" ? (
        <>
          <FlowRow
            label="Duration"
            detail={get("workoutDuration", "30") + " minutes"}
            onClick={() => setSheet("Duration")}
          />
          <h2>Workout Locations</h2>
          {data.locations.map((l) => (
            <FlowRow
              key={l.id}
              label={l.name}
              detail={`${l.equipment.length} Equipment Items`}
              href="/settings/equipment"
            />
          ))}
          <button className="button full" onClick={() => setSheet("Add Gym")}>
            + Add Gym
          </button>
          <button
            className="button full"
            onClick={() => setSheet("Add Another Location")}
          >
            + Add Another Location
          </button>
        </>
      ) : step === "injuries" ? (
        <>
          <Choices
            items={["Yes", "No"]}
            value={get("hasInjury", "No")}
            onChange={(v) => set("hasInjury", v)}
          />
          {get("hasInjury") === "Yes" && (
            <Fields
              fields={[
                {
                  key: "injuryNote",
                  label: "What is the injury or limitation?",
                  type: "textarea",
                  required: true,
                },
              ]}
              label="Continue"
              onSave={(v) => {
                setMany(v);
                router.push(next);
              }}
            />
          )}
        </>
      ) : step === "notes" ? (
        <textarea
          className="setup-notes"
          aria-label="Anything else?"
          placeholder="Anything else I should know?"
          value={get("fitnessNotes")}
          onChange={(e) => set("fitnessNotes", e.target.value)}
        />
      ) : (
        <div className="permission-intro">
          <Bell size={76} />
          <p>Get workout reminders, progress updates, and message alerts.</p>
          <article>
            <b>Workout Reminder</b>
            <p>Show up strong with Full Body Strength</p>
          </article>
          <article>
            <b>Schedule Updated</b>
            <p>All set! Today’s workout is 20 min now</p>
          </article>
        </div>
      )}
      {step !== "details" &&
        !(step === "injuries" && get("hasInjury") === "Yes") && (
          <FlowFooter
            back={prev}
            next={next}
            label={step === "notifications" ? "Finish" : "Continue"}
            onNext={() => {
              if (step === "notifications")
                setMany({ onboardingComplete: "true", homeState: "kickoff" });
            }}
          />
        )}
      {sheet && (
        <Sheet title={sheet} onClose={() => setSheet(null)}>
          {sheet === "Duration" ? (
            <Choices
              items={["15", "20", "30", "45", "60", "90"]}
              value={get("workoutDuration", "30")}
              onChange={(v) => {
                set("workoutDuration", v);
                setSheet(null);
              }}
            />
          ) : (
            <Fields
              fields={[
                {
                  key: "locationName",
                  label: "What’s the name of your gym?",
                  required: true,
                },
                {
                  key: "locationType",
                  label: "What type of gym is this?",
                  options: [
                    "Hotel Gym",
                    "Functional Training Gym",
                    "Commercial Gym",
                    "I’m not sure",
                  ],
                },
              ]}
              label="Add Location"
              onSave={(v) => {
                update((s) => ({
                  locations: [
                    ...s.locations,
                    {
                      id: crypto.randomUUID(),
                      name: v.locationName,
                      kind: v.locationType,
                      equipment: v.locationType === "Commercial Gym" ? commercialGymEquipment : [],
                    },
                  ],
                }));
                setSheet(null);
              }}
            />
          )}
        </Sheet>
      )}
    </div>
  );
}

