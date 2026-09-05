"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Search } from "lucide-react";
type Flow = {
  number: number;
  id: string;
  name: string;
  route: string;
  screens: string[];
  implementation: string;
  verification: string;
};
type ScreenEvidence = { id: string; route: string | null; instructions: string; mapping: string; visualStatus: string; evidence: string[]; evidenceScope: string };
export function ReferenceReview({ flows, screens }: { flows: Flow[]; screens: ScreenEvidence[] }) {
  const [selected, setSelected] = useState(0),
    [screen, setScreen] = useState(0),
    [query, setQuery] = useState(""),
    [compare, setCompare] = useState(false);
  const flow = flows[selected];
  const currentScreen = screens.find(s => s.id === flow.screens[screen])!;
  const mappedRoute = currentScreen.route || flow.route;
  const stateRoute = mappedRoute + (mappedRoute.includes("?") ? "&" : "?") + "capture=" + currentScreen.id;
  const total = new Set(flows.flatMap((f) => f.screens)).size;
  return (
    <main className="reference-review">
      <header>
        <div>
          <h1>Future Pro · Reference review</h1>
          <p>
            {flows.length} flows · {total} unique source screens
          </p>
        </div>
        <Link className="button" href="/">
          Open App
        </Link>
      </header>
      <p className="review-status">
        Every captured flow is mapped below. Source screenshots are reference
        material. Pixel-level parity is still under review; connected services
        and native iOS surfaces are represented locally.
      </p>
      <details className="capture-index">
        <summary>All {screens.length} capture links</summary>
        <ol>{screens.map((s, i) => <li key={s.id}><Link href={(s.route || "/") + (s.route?.includes("?") ? "&" : "?") + "capture=" + s.id}>{i + 1}. {s.id} · {s.route}</Link></li>)}</ol>
      </details>
      <div className="review-workspace">
        <aside>
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Search reference flows"
              placeholder="Search flows"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <nav aria-label="Reference flows">
            {flows
              .filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
              .map((f) => (
                <button
                  key={f.id}
                  aria-current={f.number === flow.number ? "page" : undefined}
                  onClick={() => {
                    setSelected(f.number - 1);
                    setScreen(0);
                  }}
                >
                  <b>
                    {f.number}. {f.name}
                  </b>
                  <small>
                    {f.screens.length} captures · {f.implementation}
                  </small>
                </button>
              ))}
          </nav>
        </aside>
        <section>
          <div className="review-flow-head">
            <div>
              <h2>{flow.name}</h2>
              <p>{flow.verification}</p>
            </div>
            <Link href={flow.route} className="button" target="_blank">
              Open flow <ExternalLink size={16} />
            </Link>
          </div>
          <div className="review-controls">
            <button
              className="icon-button"
              aria-label="Previous reference screen"
              disabled={!screen}
              onClick={() => setScreen((s) => s - 1)}
            >
              <ChevronLeft />
            </button>
            <span>
              Source {screen + 1} of {flow.screens.length}
            </span>
            <button
              className="icon-button"
              aria-label="Next reference screen"
              disabled={screen === flow.screens.length - 1}
              onClick={() => setScreen((s) => s + 1)}
            >
              <ChevronRight />
            </button>
            <label>
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
              />
              Show app beside reference
            </label>
            <a
              href={`https://mobbin.com/flows/${flow.id}`}
              target="_blank"
              rel="noreferrer"
            >
              View on Mobbin
            </a>
          </div>
          <section className="screen-evidence" aria-label="Selected screen coverage">
            <b>Capture {currentScreen.id} · {currentScreen.visualStatus}</b>
            <p>{currentScreen.instructions}</p>
            <small>{currentScreen.mapping}. {currentScreen.evidenceScope}.</small>
            <Link className="button" href={stateRoute} target="_blank">Open mapped state <ExternalLink size={16}/></Link>
          </section>
          <div className="reference-comparison">
            <figure>
              <figcaption>Original Mobbin capture</figcaption>
              <Image
                src={`/reference/screens/${flow.screens[screen]}.webp`}
                alt={`${flow.name}, reference screen ${screen + 1}`}
                width={1180}
                height={2676}
                unoptimized
                priority
              />
            </figure>
            {compare && (
              <figure>
                <figcaption>
                  Interactive reference fixture · changes stay in this preview
                </figcaption>
                <iframe
                  key={currentScreen.id}
                  src={stateRoute}
                  title={`${flow.name} web implementation`}
                />
              </figure>
            )}
          </div>
          <div className="reference-thumbnails">
            {flow.screens.map((id, i) => (
              <button
                key={id + i}
                aria-label={`View reference screen ${i + 1}`}
                aria-pressed={screen === i}
                onClick={() => setScreen(i)}
              >
                <Image
                  src={`/reference/screens/${id}.webp`}
                  alt=""
                  width={70}
                  height={158}
                  unoptimized
                />
                <span>{i + 1}</span>
              </button>
            ))}
          </div>
          {flow.number === 9 && (
            <div className="home-variants">
              <h3>Home states</h3>
              {[
                "kickoff",
                "setup",
                "rest",
                "pending",
                "workout",
                "running",
              ].map((v) => (
                <Link
                  className="button"
                  key={v}
                  href={`/?activity=${v}`}
                  target="_blank"
                >
                  {v}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
