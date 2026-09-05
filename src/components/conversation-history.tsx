import Link from "./capture-link";
import { CalendarDays, CheckCircle2, Dumbbell } from "lucide-react";
import { Photo, Rings } from "./primitives";
import type { ReactNode } from "react";

function Event({ title, children, icon }: { title: string; children: ReactNode; icon?: ReactNode }) {
  return <article className="conversation-event"><div>{icon}<b>{title}</b></div>{children}</article>;
}
export function ConversationHistory({ snapshot }: { snapshot: string }) {
  if (snapshot === "setup") return <>
    <p className="chat-timestamp">Fri, Jun 26</p><div className="activity-message"><small>Fri, Jun 26</small><Rings size={42} /></div>
    <p className="chat-timestamp">Saturday, 11:59 PM</p><div className="activity-message"><small>Sat, Jun 27</small><Rings size={42} /></div>
    <p className="chat-timestamp">Yesterday, 11:59 PM</p><div className="activity-message"><small>Yesterday</small><Rings size={42} /></div>
    <p className="chat-timestamp">Today, 2:52 PM</p><Event title="Coach Changed"><p>Lee Owens is now your coach.</p></Event>
    <Event title="Facetime Check-in Scheduled" icon={<CalendarDays size={18} />}><p>Thursday, Jul 2<br />12:00 AM</p></Event>
    <Event title="Equipment Removed" icon={<Dumbbell size={18} />}><p>Wall, Yoga Mat</p><small>Home</small></Event>
  </>;
  if (snapshot === "yoga") return <>
    <p className="outgoing-message">Hi sorry! Actually I think we can discuss via chat instead?</p><p className="chat-timestamp">Today, 10:56 AM</p>
    <p className="heart-rate-event">HEART RATE ZONES ACTIVATED WITH A MAX HEART RATE OF 193</p>
    <Link className="yoga-result-group" href="/workouts/morning-yoga/summary"><div className="yoga-result-content"><b><CheckCircle2 size={15} fill="currentColor" stroke="white" />Morning Yoga Flow</b><div className="yoga-result-stats"><span><strong>50</strong>Calories Burned</span><span><strong>18:51</strong>Duration</span></div><div className="yoga-challenge-progress"><span aria-label="1 of 12 workouts completed" /><div>Strong Start Challenge<small>You’ve knocked out 1 of 12 workouts!</small></div></div></div><p>I&apos;m trying yoga bcs I wanna know how it feels. Never done it before. I think my form is not quite right, bcs my flexibility is not that good</p></Link>
    <Link className="challenge-start" href="/progress"><Photo crop={{src:"screens/e9f1d9e135143206.webp",sw:902,sh:2048,x:38,y:1122,w:826,h:303}} alt="Athletes running past a concrete wall" priority /><div><h2>You just kicked off<br/>Strong Start Challenge</h2><p>Crush 12 workouts in your first 30 days</p></div></Link>
  </>;
  if (snapshot === "events") return <>
    <div className="activity-message"><small>Yesterday</small><div><Rings active size={42} /><span><small>Active</small>18 min</span></div></div><p className="chat-timestamp">Today, 1:26 PM</p>
    <Event title="Event Added" icon={<CalendarDays size={18} />}><p>5K Jakarta Open Trail Run</p><b>Jul 26</b><p>Elevation gain: 284 M</p></Event>
    <Event title="GOAL CHANGE"><p>Improve Health and Longevity</p><small>Updated from Lose Weight</small></Event>
    <Link className="conversation-event" href="/progress/weight"><b>METRIC UPDATED</b><p>JUL 2026</p><div className="metric-event-chart"><i /><i /><i /><i /><i /></div></Link>
  </>;
  if (snapshot === "away") return <>
    <p className="coach-away">Your coach will be unavailable today (Thursday, 7/2) and tomorrow (Friday, 7/3) to celebrate Independence Day</p>
    <p className="coach-message">Just the plank? Not any other movement? Odd!!</p><p className="chat-timestamp">Yesterday, 6:10 PM</p>
    <Event title="Equipment Added" icon={<Dumbbell size={18} />}><p>Elliptical, Wall, Dumbbell</p><small>Hotel gym</small></Event>
    <p className="chat-timestamp">Yesterday, 11:59 PM</p><div className="activity-message"><small>Yesterday</small><div><Rings active size={42} /><span><small>Active</small>46 min</span></div></div>
    <Link href="/workouts/bodyweight-beach" className="conversation-workout-result"><small>TODAY’S WORKOUT</small><h2>Flex Friday</h2><p>TOTAL BODY—BODY WEIGHT CIRCUIT</p></Link>
  </>;
  return null;
}
