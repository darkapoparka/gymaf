import Link from "next/link";
import { notFound } from "next/navigation";
export default async function Preview({ searchParams }: { searchParams: Promise<{ route?: string; width?: string; height?: string; bare?: string }> }) {
  if (process.env.NODE_ENV !== "development" || process.env.GYMAF_REFERENCE_PREVIEW !== "1") notFound();
  const params = await searchParams;
  const requested = typeof params.route === "string" ? params.route : "/";
  const route = requested.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\") && !/^\/(preview|reference-import)/.test(requested) ? requested : "/";
  const width = [320,393,1440].includes(Number(params.width)) ? Number(params.width) : 393;
  const height = width === 320 ? 740 : width === 1440 ? 1000 : 852;
  return <main className={`device-preview ${params.bare === "1" ? "bare" : ""}`}><header><Link href="/review">Reference review</Link><span>{width} × {height}</span>{[320,393,1440].map(w => <Link key={w} href={`/preview?route=${encodeURIComponent(route)}&width=${w}`}>{w}px</Link>)}</header><iframe title="App device preview" src={route} width={width} height={height} style={{ width,height,border:0,display:"block" }} /></main>;
}
