"use client";
import Link from "./capture-link";
import {
  Plus,
  Home,
  Dumbbell,
  Smartphone,
  Watch,
  ShieldCheck,
  Info,
  ChevronRight,
} from "lucide-react";
import { useLocalData } from "@/lib/store";
import { media } from "@/lib/data";
import { Photo, Row } from "./primitives";

import { FlowHead } from "./flow-primitives";

export function SettingsScreen() {
  const { data, update } = useLocalData();
  function select(key: string, value: string) {
    update((s) => ({ preferences: { ...s.preferences, [key]: value } }));
  }
  return (
    <div className="settings-sheet-page">
      <FlowHead title="Settings" back="/profile" close />
      <div className="settings-content">
        <div className="row-group">
          <Row href="/account" detail="Your Account">
            {data.name}
          </Row>
        </div>
        <h2>Travel &amp; Events</h2>
        <Row href="/profile/event" icon={<Plus />}>
          Add Travel or Event
        </Row>
        <h2>Locations &amp; Equipment</h2>
        <div className="row-group">
          {data.locations.map((l) => (
            <Link
              key={l.id}
              href="/settings/equipment"
              className="row"
              onClick={() => select("activeLocation", l.id)}
            >
              {l.kind === "Home" ? <Home /> : <Dumbbell />}
              <span className="row-copy">
                <span>{l.name}</span>
                <small>{l.equipment.length} Equipment Items</small>
              </span>
              <ChevronRight size={18} className="row-chevron" />
            </Link>
          ))}
          <Row href="/settings/location" icon={<Plus />}>
            Add New Location
          </Row>
        </div>
        <h2>Injuries</h2>
        <div className="row-group">
          {data.injuries.map((i) => (
            <Link
              className="row"
              key={i.id}
              href="/settings/injury/detail"
              onClick={() => select("activeInjury", i.id)}
            >
              {i.description}
            </Link>
          ))}
          <Row href="/settings/injury" icon={<Plus />}>
            Add New Injury
          </Row>
        </div>
        <div className="row-group settings-links">
          <Row href="/settings/app" icon={<Smartphone />}>
            App Settings
          </Row>
          <Row href="/settings/workout" icon={<Dumbbell />}>
            Workout Settings
          </Row>
          <Row href="/coaches/change">Change Coach</Row>
          <Row href="/settings/watch" icon={<Watch />}>
            Apple Watch
          </Row>
          <Row href="/settings/permissions" icon={<ShieldCheck />}>
            Permissions
          </Row>
          <Row href="/settings/about" icon={<Info />}>
            About
          </Row>
        </div>
      </div>
    </div>
  );
}
export function WelcomeScreen() {
  return (
    <div className="welcome-page">
      <div className="welcome-image">
        <Photo
          crop={media.welcome}
          alt="Athlete preparing for a workout"
          priority
        />
      </div>
      <Link href="/" className="wordmark">
        future<span>Pro</span>
      </Link>
      <div className="welcome-copy">
        <h1>
          Personal coaching,
          <br />
          reimagined.
        </h1>
        <p>
          Train with one of the world’s greatest coaches. Built to fit your
          health goals.
        </p>
        <Link className="button" href="/onboarding/contact">
          Let’s Start
        </Link>
        <Link className="welcome-preview" href="/login">
          Already a member? Sign In
        </Link>
      </div>
    </div>
  );
}
