"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="app-shell gymaf-connected gymaf-stack"><h1>This page could not load</h1><p>No successful operation is implied. Check the local configuration and migration steps in astra/LOCAL_TESTING.md, then retry.</p><div className="button-row"><button className="button primary" onClick={reset}>Try again</button><Link className="button" href="/">Return to Gymaf</Link></div></main>;
}
