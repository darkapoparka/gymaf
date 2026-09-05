"use client";
import Link from "./capture-link";
import { useAppRouter as useRouter } from "./capture-link";
import { useState } from "react";
import { Photo, Sheet } from "./primitives";
import { FlowHead, usePreferences } from "./flow-primitives";
import type { Crop } from "@/lib/data";

const portraits: Record<string, Crop> = {
  Noah: { src: "screens/de6aa2a677652a59.webp", sw: 903, sh: 2048, x: 118, y: 325, w: 668, h: 727 },
  Garrett: { src: "screens/55b876bd2a1cf2ec.webp", sw: 902, sh: 2048, x: 121, y: 347, w: 659, h: 715 },
  Matt: { src: "screens/cdd7b72066569858.webp", sw: 903, sh: 2048, x: 47, y: 317, w: 808, h: 833 },
};
export function ChangeCoachPortrait({ retention = false }: { retention?: boolean }) {
  const name = retention ? "Garrett" : "Noah";
  const source = portraits[name];
  return <div className="alternative-carousel">
    <Photo crop={{ ...source, x: 0, y: 400, w: 60, h: 650 }} className="coach-alternative-peek left" />
    <div className="alternative-portrait"><Photo crop={source} alt={name} priority /><div><h2>{name}</h2><p>{retention ? "Corrective Exercise" : "Strength + Conditioning"}</p></div></div>
    <Photo crop={{ ...source, x: 842, y: 400, w: 60, h: 650 }} className="coach-alternative-peek right" />
  </div>;
}
export function MattCoach() {
  const [more, setMore] = useState(false);
  const { set } = usePreferences();
  const router = useRouter();
  return <div className="flow-page matt-coach"><FlowHead title="Coaches" back="/coaches/change" />
    <article className="matt-card"><Photo crop={portraits.Matt} alt="Matt" priority /><div><h1>Matt</h1><b>Past experience</b><p>Previously: Director of Sport Performance at the NCAA Division I level. Matt has coached three championship teams across three different sports.</p><button className="button" onClick={() => setMore(true)}>More About Matt</button></div></article>
    <button className="button primary full" onClick={() => { set("selectedCoach", "Matt"); router.push("/appointments"); }}>Continue with Matt</button>
    <Link className="button full" href="/coaches/search">View More Coaches</Link>
    {more && <Sheet title="Matt" onClose={() => setMore(false)}><p>Director of Sport Performance at the NCAA Division I level.</p><p>Matt has coached three championship teams across three different sports.</p><button className="button primary full" onClick={() => { set("selectedCoach", "Matt"); router.push("/appointments"); }}>Continue with Matt</button></Sheet>}
  </div>;
}
