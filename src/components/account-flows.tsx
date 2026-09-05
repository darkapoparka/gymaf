"use client";
import { useCaptureState } from "@/lib/capture-context";
import Link from "./capture-link";
import { useAppRouter as useRouter } from "./capture-link";
import { Check, ChevronDown, Dumbbell, Heart, Search, Watch, X } from "lucide-react";
import {
  Choices,
  Fields,
  FlowHead,
  FlowRow,
  Toggle,
  usePreferences,
} from "./flow-primitives";
import { Photo, Sheet } from "./primitives";
import { equipmentCrops } from "@/lib/reference-crops";
import { ChangeCoachPortrait } from "./coach-alternatives";

import { media } from "@/lib/data";
import { equipment, commercialGymEquipment } from "@/lib/equipment";
const exclusions = [
  "Med Ball Scoop Toss",
  "Stability Ball Pike",
  "Tripod Headstand",
  "Kettlebell Clean to Push Press",
  "Sandbag Push Press",
  "Dumbbell Hang Clean to Push Press",
  "Headstand",
];

export function AccountFlows({ path }: { path: string }) {
  const { data, get, set, setMany, update } = usePreferences();
  const router = useRouter();
  const [sheet, setSheet] = useCaptureState<string | null>("account.sheet", null);
  const [query, setQuery] = useCaptureState("account.query", "");
  const [filter, setFilter] = useCaptureState("account.filter", "All");
  const [tab, setTab] = useCaptureState("account.tab", "All Equipment");
  const [notice, setNotice] = useCaptureState("account.notice", "");
  const [saving, setSaving] = useCaptureState("account.saving", false);
  const activeLocation =
    data.locations.find((l) => l.id === get("activeLocation")) ??
    data.locations[0];
  const injury =
    data.injuries.find((i) => i.id === get("activeInjury")) ??
    data.injuries.at(-1);
  const back = path.startsWith("account/")
    ? "/account"
    : path === "account"
      ? "/settings"
      : "/settings";
  function finish(values: Record<string, string>, href: string) {
    setMany(values);
    router.push(href);
  }
  function toggleEquipment(item: string) {
    if (!activeLocation) return;
    update((s) => ({
      locations: s.locations.map((l) =>
        l.id === activeLocation.id
          ? {
              ...l,
              equipment: l.equipment.includes(item)
                ? l.equipment.filter((v) => v !== item)
                : [...l.equipment, item],
            }
          : l,
      ),
    }));
    if (item === "Dumbbell") setSheet("Select Dumbbells");
  }
  if (path === "coaches/change")
    return (
      <div className="flow-page change-coach">
        <Photo crop={media.ocean} className="change-coach-underlay" />
        <FlowHead title="Change Coach" back="/profile" close />
        <ChangeCoachPortrait />
        <div className="change-coach-copy">
          <h1>Find your next coach</h1>
          <p>
            The right coach gets you to your goal faster. Browse by specialty
            and training style to find your match.
          </p>
          <div className="change-coach-actions"><button
            className="button primary full"
            onClick={() => setSheet("Explore")}
          >
            Explore
          </button>
          <Link className="button full" href="/account/help/support">
            Contact Us
          </Link></div>
        </div>
        {sheet && (
          <Sheet title="Find your next coach" onClose={() => setSheet(null)}>
            <h2>What are you looking for?</h2>
            <Choices
              multiple
              items={[
                "Ready for something new",
                "Different coach personality",
                "Goal-specific expertise",
                "Mismatch in training style",
                "Different workouts",
                "Faster results",
                "Something else",
              ]}
              value={get("coachChangeReasons").split("|")}
              onChange={(v) => {
                const a = get("coachChangeReasons").split("|");
                set(
                  "coachChangeReasons",
                  (a.includes(v) ? a.filter((x) => x !== v) : [...a, v])
                    .filter(Boolean)
                    .join("|"),
                );
              }}
            />
            <Link href="/coaches/matt" className="button primary full">
              Continue
            </Link>
          </Sheet>
        )}
      </div>
    );
  if (path === "account/cancel")
    return (
      <div className="flow-page change-coach">
        <Photo crop={media.ocean} className="change-coach-underlay" />
        <FlowHead
          title="Change Coach"
          back={path === "account/cancel" ? "/account/membership" : "/profile"}
          close
        />
        <ChangeCoachPortrait retention />
        <div className="change-coach-copy">
          <h1>Interested in a Fresh Start?</h1>
          <p>
            We’re sorry we didn’t meet your expectations, and we’d love to try
            to make things right. Do you want to try out a different coach?
          </p>
          <div className="change-coach-actions"><Link href="/coaches/search" className="button primary full">
            Explore
          </Link>
          {path === "account/cancel" ? (
            <Link className="button full" href="/account/cancel/offer">
              Continue to Cancel
            </Link>
          ) : (
            <button
              className="button full"
              onClick={() => setSheet("Change Coach")}
            >
              Request a Coach Change
            </button>
          )}</div>
        </div>
        {sheet && (
          <Sheet title={sheet} onClose={() => setSheet(null)}>
            <Fields
              fields={[
                {
                  key: "coachChangeReason",
                  label: "What are you looking for in your next coach?",
                  type: "textarea",
                  required: true,
                },
              ]}
              onSave={(v) => {
                setMany(v);
                setSheet(null);
                setNotice(
                  "Request saved locally. Coach services are not connected.",
                );
              }}
            />
          </Sheet>
        )}
        {notice && <p role="status">{notice}</p>}
      </div>
    );
  if (path === "settings/equipment")
    return (
      <div className="flow-page equipment-flow">
        <header className="flow-head equipment-head">
          <Link className="icon-button" href="/settings" aria-label="Close"><X /></Link>
          <h1><button onClick={() => setSheet("Edit Location")}>{activeLocation?.name ?? "Your Equipment"}<ChevronDown size={16}/></button></h1>
          <Link className="icon-button equipment-done" href="/settings" aria-label="Done"><Check/></Link>
        </header>
        <div className="tabs">
          <button
            aria-pressed={tab === "Your Setup"}
            onClick={() => setTab("Your Setup")}
          >
            Your Setup {activeLocation?.equipment.length}
          </button>
          <button
            aria-pressed={tab === "All Equipment"}
            onClick={() => setTab("All Equipment")}
          >
            All Equipment
          </button>
        </div>
        <label className="search-field">
          <Search size={18} />
          <input
            placeholder="Search Equipment"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="filter-pills">
          {["All", "Bands", "Cardio", "Machines", "Mobility"].map((f) => (
            <button
              aria-pressed={filter === f}
              key={f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="equipment-grid">
          {(tab === "Your Setup"
            ? (activeLocation?.equipment ?? [])
            : [...equipment].sort()
          )
            .filter((e) => e.toLowerCase().includes(query.toLowerCase()))
            .filter(
              (e) =>
                filter === "All" ||
                (filter === "Machines" && e.includes("Machine")) ||
                (filter === "Bands" && e.includes("Band")) ||
                (filter === "Cardio" && /Bike|Elliptical|Treadmill/.test(e)) ||
                (filter === "Mobility" && /Roll|Mat|Wall/.test(e)),
            )
            .map((e) => (
              <button
                className={
                  activeLocation?.equipment.includes(e) ? "selected" : ""
                }
                key={e}
                aria-pressed={activeLocation?.equipment.includes(e) ?? false}
                onClick={() => toggleEquipment(e)}
              >
                <span>{e}</span>
                {equipmentCrops[e] ? <Photo crop={equipmentCrops[e]} alt={e}/> : <Dumbbell size={42}/>}
                {activeLocation?.equipment.includes(e) && <Check size={17} />}
              </button>
            ))}
        </div>
        {sheet && (
          <Sheet title={sheet} onClose={() => setSheet(null)}>
            {sheet === "Select Dumbbells" ? (
              <>
                <div className="weight-grid">
                  {[
                    0.45, 0.9, 1.4, 1.8, 2.3, 2.7, 3.2, 3.4, 3.6, 4.1, 4.5, 5,
                    5.4, 5.7, 5.9, 6.4, 6.8, 7.3, 7.7, 7.9, 8.2, 8.6, 9.1, 9.5,
                    10, 10.2, 10.4, 10.9, 11.3, 12.5,
                  ].map((w) => (
                    <button
                      key={w}
                      aria-pressed={get("dumbbell-" + w) === "true"}
                      onClick={() =>
                        set(
                          "dumbbell-" + w,
                          get("dumbbell-" + w) === "true" ? "false" : "true",
                        )
                      }
                    >
                      {w} kg
                    </button>
                  ))}
                </div>
                <button
                  className="button primary full"
                  onClick={() => setSheet(null)}
                >
                  Done
                </button>
              </>
            ) : (
              <Fields
                fields={[
                  {
                    key: "editedLocationName",
                    label: "Location Name",
                    required: true,
                    value: activeLocation?.name,
                  },
                ]}
                onSave={(v) => {
                  update((s) => ({
                    locations: s.locations.map((l) =>
                      l.id === activeLocation?.id
                        ? { ...l, name: v.editedLocationName }
                        : l,
                    ),
                  }));
                  setSheet(null);
                }}
              />
            )}
          </Sheet>
        )}
      </div>
    );
  if (path === "settings/location")
    return (
      <div className="flow-page">
        <FlowHead title="Add New Location" back="/settings" close />
        <h2>What type of location is this?</h2>
        <Choices
          items={["Home", "Gym", "Outdoor", "Somewhere Else"]}
          value={get("newLocationType", "Gym")}
          onChange={(v) => set("newLocationType", v)}
        />
        <Fields
          fields={[
            {
              key: "newLocationName",
              label: "What’s the name of this location?",
              placeholder: "Location name",
              required: true,
            },
          ]}
          label="Next"
          onSave={(v) => {
            const id = crypto.randomUUID();
            update((s) => ({
              locations: [
                ...s.locations,
                {
                  id,
                  name: v.newLocationName,
                  kind: get("newLocationType", "Gym"),
                  equipment: get("newLocationType", "Gym") === "Gym" ? commercialGymEquipment : [],
                },
              ],
              preferences: { ...s.preferences, activeLocation: id },
            }));
            router.push("/settings/equipment");
          }}
        />
      </div>
    );
  if (path.startsWith("settings/injury"))
    return (
      <div className="flow-page">
        <FlowHead
          title={
            path === "settings/injury" ? "Add Injury" : "Injury/Limitation"
          }
          back="/settings"
          close
        />
        {path === "settings/injury" ? (
          <Fields
            fields={[
              {
                key: "injuryDescription",
                label: "What is the injury or limitation?",
                placeholder: "Let us know what’s going on",
                type: "textarea",
                required: true,
              },
              {
                key: "injuryMovement",
                label: "Does this affect your ability to move or exercise?",
                options: ["Yes", "No"],
              },
            ]}
            label="Save Injury"
            onSave={(v) => {
              const id = crypto.randomUUID();
              update((s) => ({
                injuries: [
                  ...s.injuries,
                  {
                    id,
                    description: v.injuryDescription,
                    affectsMovement: v.injuryMovement === "Yes",
                    excluded: [],
                  },
                ],
                preferences: { ...s.preferences, activeInjury: id },
              }));
              router.push("/settings/injury/detail");
            }}
          />
        ) : (
          <>
            <h2>About</h2>
            <p>{injury?.description ?? "No injury or limitation saved."}</p>
            {injury && (
              <button
                className="button"
                onClick={() => setSheet("Delete Limitation")}
              >
                Delete Limitation
              </button>
            )}
            <h2>Excluded Movements</h2>
            <p>
              These exercises will not be included in any of your programmed
              workouts.
            </p>
            <p className="note">
              Select exclusions for your local plan. Automated clinical
              assessment is not connected.
            </p>
            {path.endsWith("exclusions") ? (
              <Choices
                items={exclusions}
                multiple
                value={injury?.excluded ?? []}
                onChange={(v) =>
                  update((s) => ({
                    injuries: s.injuries.map((i) =>
                      i.id === injury?.id
                        ? {
                            ...i,
                            excluded: i.excluded.includes(v)
                              ? i.excluded.filter((e) => e !== v)
                              : [...i.excluded, v],
                          }
                        : i,
                    ),
                  }))
                }
              />
            ) : (
              <div className="row-group">
                {[
                  "Deltoids",
                  "Core",
                  "Lower Back",
                  "Obliques",
                  "Upper Back",
                ].map((m) => (
                  <FlowRow
                    key={m}
                    label={m}
                    href="/settings/injury/exclusions"
                  />
                ))}
              </div>
            )}
          </>
        )}
        {sheet && (
          <Sheet title={sheet} onClose={() => setSheet(null)}>
            <p>Remove this limitation from your local profile?</p>
            <button
              className="button primary full"
              onClick={() => {
                update((s) => ({
                  injuries: s.injuries.filter((i) => i.id !== injury?.id),
                }));
                router.push("/settings");
              }}
            >
              Delete Limitation
            </button>
          </Sheet>
        )}
      </div>
    );
  if (path === "settings/app")
    return (
      <div className="flow-page">
        <FlowHead title="App Settings" back="/settings" />
        <h2>Notifications</h2>
        <FlowRow
          label="Repeat Alerts"
          detail={get("repeatAlerts", "Once")}
          onClick={() => setSheet("Repeat Alerts")}
        />
        <h2>Privacy</h2>
        <label className="switch-row">
          Private Profile
          <input
            type="checkbox"
            checked={data.privateProfile}
            onChange={(e) => update({ privateProfile: e.target.checked })}
          />
        </label>
        <p className="note">
          When enabled, only your photo, cover image, name and basic stats will
          display to others. All other information will remain private.
        </p>
        <Toggle
          pref="hideContactSync"
          label="Hide Me From Contact Syncing"
          description="When enabled, you won’t be suggested as a friend to other members who have your email or phone number in their contacts."
        />
        <h2>Health Metrics</h2>
        <Toggle
          pref="autoWeight"
          label="Automatic Weight Updates"
          defaultOn
          description="When body weight updates are recorded in the Health app, they are used to update your weight goals."
        />
        <Toggle
          pref="hideCalories"
          label="Hide Calories"
          description="Calories burned will be hidden throughout the app."
        />
        <h2>Camera Roll</h2>
        <Toggle pref="savePhotos" label="Save Photos" />
        <Toggle
          pref="saveVideos"
          label="Save Videos"
          description="Automatically save photos and videos taken in Future Pro to the device’s camera roll."
        />
        {sheet && (
          <Sheet title={sheet} onClose={() => setSheet(null)}>
            <Choices
              items={[
                "Never",
                "Once",
                "Twice",
                "3 Times",
                "5 Times",
                "10 Times",
              ]}
              value={get("repeatAlerts", "Once")}
              onChange={(v) => {
                set("repeatAlerts", v);
                setSheet(null);
              }}
            />
          </Sheet>
        )}
      </div>
    );
  if (
    path === "settings/watch" ||
    path === "settings/permissions" ||
    path === "settings/about"
  )
    return (
      <div className="flow-page">
        <FlowHead
          title={
            path.endsWith("watch")
              ? "Apple Watch"
              : path.endsWith("permissions")
                ? "Permissions & Watch App"
                : "About"
          }
          back="/settings"
        />
        {path.endsWith("watch") ? (
          <>
            <div className="watch-illustration">
              <Watch size={140} />
              <Heart size={25} />
              <strong>137 BPM</strong>
            </div>
            <h1>Accountability with Apple Watch</h1>
            <p>
              With an Apple Watch, detailed fitness stats are delivered to you
              and shared with your coach. Plus, you’ll enjoy a more seamless
              workout experience with features like auto-rep counting, quick
              weight adjustments, and more.
            </p>
            <button
              className="button primary full"
              onClick={() => setSheet("Apple Watch")}
            >
              GET AN APPLE WATCH
            </button>
            <button
              className="button full"
              onClick={() => setSheet("Setting Up Your Apple Watch")}
            >
              SETTING UP YOUR APPLE WATCH
            </button>
          </>
        ) : path.endsWith("permissions") ? (
          <>
            <div className="row-group">
              {[
                "Notifications",
                "Health",
                "Location",
                "Movement",
                "Bluetooth",
              ].map((p) => (
                <FlowRow
                  key={p}
                  label={p}
                  detail="Not connected"
                  onClick={() => setSheet(p)}
                />
              ))}
            </div>
            <p className="note">
              Enabling permissions ensures a smooth training experience. Native
              health and watch connections require the iOS app.
            </p>
            <FlowRow
              label="Connect Your Apple Watch"
              detail="Guide"
              href="/settings/watch"
            />
            <p>Pair a watch for workout data</p>
            <p>
              Need more help with permissions or connecting your Apple Watch?
              help@future.co
            </p>
          </>
        ) : (
          <>
            <h1>Future Pro</h1>
            <p>Version 2026.9 (2022)</p>
            <div className="row-group">
              {[
                "Rate Future Pro",
                "Give Feedback",
                "FAQs",
                "Instagram",
                "Facebook",
                "Twitter",
                "Terms Of Service",
                "Privacy Policy",
                "Acknowledgements",
              ].map((label) => (
                <FlowRow
                  key={label}
                  label={label}
                  onClick={() => setSheet(label)}
                />
              ))}
            </div>
            <p className="note">
              Local web reference implementation. Version text above is from the
              supplied iOS capture.
            </p>
            <Link className="button" href="/review">
              Screen & Flow Coverage
            </Link>
          </>
        )}
        {sheet && (
          <Sheet title={sheet} onClose={() => setSheet(null)}>
            <p>
              {path.endsWith("about")
                ? "This destination is outside the captured app flow. The local preview does not submit feedback or connect to social accounts."
                : "This native iOS integration is not available in the local web preview."}
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

  let content;
  const titles: Record<string, string> = {
    account: "Your Account",
    "account/membership": "Membership & Billing",
    "account/plan": "Change Membership Plan",
    "account/cancel/offer": "Cancel Membership",
    "account/cancel/confirm": "Cancel Membership",
    "account/cancel/done": "Cancel Membership",
    "account/shipping": "Shipping Address",
    "account/payment": "Update Payment Method",
    "account/help": "Account Help",
    "account/help/billing": "Billing",
    "account/help/support": "Message Support",
    "account/help/delete": "Account Help",
  };
  if (path === "account")
    content = (
      <>
        <h2>About You</h2>
        <Fields
          fields={[
            {
              key: "preferredName",
              label: "Preferred Name",
              value: data.name.split(" ")[0],
            },
            {
              key: "firstName",
              label: "First Name",
              value: "Alex",
              required: true,
            },
            {
              key: "lastName",
              label: "Last Name",
              value: "Smith",
              required: true,
            },
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
            {
              key: "height",
              label: "Height (cm)",
              type: "number",
              value: "175",
            },
            {
              key: "bodyWeight",
              label: "Weight (lbs)",
              type: "number",
              value: "154",
            },
            {
              key: "email",
              label: "Email",
              type: "email",
              value: "alexsmith.mobbin@gmail.com",
            },
            { key: "phone", label: "Phone Number", type: "tel" },
          ]}
          onSave={(v) => {
            setMany(v);
            update({ name: v.firstName + " " + v.lastName });
            setNotice("Account details saved on this device.");
          }}
        />
        <button className="button full" onClick={() => setSheet("Sign Out")}>
          Sign Out
        </button>
        <FlowRow label="Membership & Billing" href="/account/membership" />
        <FlowRow label="Account Help" href="/account/help" />
      </>
    );
  else if (path === "account/membership")
    content = (
      <>
        <div className="membership-status">
          <Check />
          <h2>{get("membershipStatus", "Active")}</h2>
          <p>
            {get("membershipStatus") === "Pending Cancellation"
              ? "Membership will end on July 25"
              : "Member since June 2026"}
          </p>
        </div>
        <h2>Membership</h2>
        <div className="row-group">
          <FlowRow
            label={get("membershipPlan", "Monthly") + " Plan"}
            detail="US$199/mo"
            href="/account/plan"
          />
          <FlowRow label="Change Membership Plan" href="/account/plan" />
          {get("membershipStatus") === "Pending Cancellation" ? (
            <FlowRow
              label="Reactivate Membership"
              onClick={() => {
                set("membershipStatus", "Active");
                setNotice(
                  "Reference membership reactivated locally. No charge was made.",
                );
              }}
            />
          ) : (
            <FlowRow label="Cancel Membership" href="/account/cancel" />
          )}
        </div>
        <h2>Shipping Address</h2>
        <FlowRow
          label={get("shippingStreet", "Shipping Address")}
          detail={get("shippingCity")}
          href="/account/shipping"
        />
        <h2>Payment Method</h2>
        <FlowRow
          label="Visa ending in ••••"
          detail="Membership active"
          href="/account/payment"
        />
        <Link className="button full" href="/account/payment">
          Update Payment Method
        </Link>
        <p className="note">
          Reference membership and prices. No live subscription or billing
          account is connected.
        </p>
      </>
    );
  else if (path === "account/plan")
    content = (
      <>
        <p>
          With Future Pro membership plans, you can choose your commitment
          length and enjoy savings
        </p>
        <div className="plan-options">
          {[
            ["Monthly", "199", ""],
            ["3 Months", "179", "537"],
            ["6 Months", "169", "1,014"],
            ["Annual", "149", "1,788"],
          ].map(([plan, price, total]) => (
            <button
              className={
                get("membershipPlan", "Monthly") === plan ? "selected" : ""
              }
              key={plan}
              onClick={() => {
                set("membershipPlan", plan);
                setNotice("Plan selection saved locally.");
              }}
            >
              <span>
                <strong>{plan}</strong>
                <small>{total ? "Total US$" + total : "CURRENT PLAN"}</small>
              </span>
              <b>US${price}/mo</b>
              {get("membershipPlan", "Monthly") === plan && <Check size={20} />}
            </button>
          ))}
        </div>
        <p className="note">
          If you choose to change your membership it will start on 26 July 2026.
        </p>
      </>
    );
  else if (path === "account/cancel/offer")
    content = (
      <div className="cancel-offer">
        <h1>One last chance offer.</h1>
        <p>
          While we work to make Future Pro right for you, we’re happy to offer
          you a membership at a reduced rate.
        </p>
        <article>
          <h2>One Month For US$99</h2>
          <p>Save US$100 on your next month’s membership. Cancel anytime.</p>
        </article>
        <button
          className="button primary full"
          onClick={() => {
            set("membershipOffer", "99");
            router.push("/account/membership");
          }}
        >
          Claim Offer
        </button>
        <Link className="button full" href="/account/cancel/confirm">
          Continue to Cancel
        </Link>
      </div>
    );
  else if (path === "account/cancel/confirm")
    content = (
      <div className="cancel-offer">
        <span className="auth-wordmark">
          future<span>Pro</span>
        </span>
        <h1>Are you sure you want to cancel your membership?</h1>
        <p>
          You’ll lose access to Future Pro on July 25 when your membership ends.
        </p>
        <button
          className="button primary full"
          disabled={saving}
          onClick={() => {
            setSaving(true);
            setTimeout(() => {
              set("membershipStatus", "Pending Cancellation");
              router.push("/account/cancel/done");
            }, 700);
          }}
        >
          {saving ? "Canceling Membership…" : "CANCEL MEMBERSHIP"}
        </button>
        <Link className="button full" href="/account/membership">
          BACK
        </Link>
        <p className="note">Changes only the local reference membership.</p>
      </div>
    );
  else if (path === "account/cancel/done")
    content = (
      <div className="cancel-offer">
        <h1>Membership Ends on July 25</h1>
        <p>
          You can reactivate your membership from the Profile view. For further
          assistance, please contact help@future.co.
        </p>
        <Link className="button primary full" href="/account/membership">
          OK
        </Link>
      </div>
    );
  else if (path === "account/shipping")
    content = (
      <Fields
        fields={[
          { key: "shippingStreet", label: "Street Address", required: true },
          { key: "shippingApt", label: "Apt, suite, etc. (optional)" },
          { key: "shippingCity", label: "City", required: true },
          { key: "shippingState", label: "State", required: true },
          { key: "shippingZip", label: "Zip code", required: true },
          {
            key: "shirtSize",
            label: "Shirt Size",
            options: ["Select", "XS", "S", "M", "L", "XL", "XXL"],
          },
        ]}
        label="Update"
        onSave={(v) => finish(v, "/account/membership")}
      />
    );
  else if (path === "account/payment")
    content = (
      <Fields
        fields={[
          {
            key: "cardNumber",
            label: "Credit Card",
            placeholder: "Test card only",
          },
          { key: "cardExpiry", label: "MM/YY" },
          { key: "cardCvc", label: "CVC" },
        ]}
        label="Update Payment Method"
        onSave={() =>
          setNotice(
            "Payment processing is not connected. No card details were stored.",
          )
        }
      >
        <p className="note">
          Use test information only in this local payment preview.
        </p>
      </Fields>
    );
  else if (path === "account/help" || path === "account/help/delete")
    content = (
      <>
        <div className="row-group">
          <FlowRow label="FAQs" onClick={() => setSheet("FAQs")} />
          <FlowRow label="Billing Questions" href="/account/help/billing" />
          <FlowRow label="Cancel Membership" href="/account/cancel" />
          <FlowRow label="Message Support" href="/account/help/support" />
          <FlowRow
            label="Permanent Account Deletion"
            onClick={() => setSheet("Permanently Delete Account")}
          />
        </div>
        {path.endsWith("delete") && (
          <div className="delete-account-copy">
            <h2>Permanently Delete Account</h2>
            <p>
              Account deletion is an irreversible action that will permanently
              delete your account and all associated data from our servers.
            </p>
            <p>
              If you decide to return to Future Pro at any point after your
              account deletion is confirmed, you’ll need to create a brand new
              account.
            </p>
            <button
              className="button primary full"
              onClick={() =>
                setNotice(
                  "Deletion request saved as a local preview. No real account or stored data was deleted.",
                )
              }
            >
              Request Account Deletion
            </button>
            <Link className="button full" href="/account/help">
              Cancel
            </Link>
          </div>
        )}
      </>
    );
  else
    content = (
      <Fields
        fields={[
          {
            key: path.endsWith("billing")
              ? "billingQuestion"
              : "supportMessage",
            label: path.endsWith("billing")
              ? "What’s your billing question?"
              : "How can we help?",
            type: "textarea",
            required: true,
          },
        ]}
        label="Send"
        onSave={(v) => {
          setMany(v);
          setNotice(
            "Message saved locally. Support delivery is not connected.",
          );
        }}
      />
    );
  return (
    <div className="flow-page">
      <FlowHead
        title={titles[path] ?? "Settings"}
        back={path.includes("cancel/") ? "/account/membership" : back}
        close
      />
      {content}
      {notice && (
        <p className="note" role="status">
          {notice}
        </p>
      )}
      {sheet && (
        <Sheet title={sheet} onClose={() => setSheet(null)}>
          {sheet === "Sign Out" ? (
            <>
              <p>Are you sure you want to sign out?</p>
              <Link
                className="button primary full"
                href="/welcome"
                onClick={() => set("signedIn", "false")}
              >
                Sign Out
              </Link>
              <button className="button full" onClick={() => setSheet(null)}>
                Cancel
              </button>
            </>
          ) : sheet === "Permanently Delete Account" ? (
            <>
              <p>
                Account deletion permanently removes your account and associated
                data.
              </p>
              <Link className="button primary full" href="/account/help/delete">
                Review Account Deletion
              </Link>
              <button className="button full" onClick={() => setSheet(null)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <p>Choose a topic to get help with your account.</p>
              <FlowRow label="Billing Questions" href="/account/help/billing" />
              <FlowRow label="Message Support" href="/account/help/support" />
            </>
          )}
        </Sheet>
      )}
    </div>
  );
}
