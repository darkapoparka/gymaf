import Link from "next/link";
export default async function Preview({ searchParams }: { searchParams: Promise<{ route?: string; width?: string; height?: string; bare?: string }> }) {
  const params = await searchParams;
  const route = params.route?.startsWith("/") && !params.route.startsWith("//") && !/^\/(preview|reference-import)/.test(params.route) ? params.route : "/";
  const width = [320,393,1440].includes(Number(params.width)) ? Number(params.width) : 393;
  const height = width === 320 ? 740 : width === 1440 ? 1000 : 852;
  return <main className={`device-preview ${params.bare === "1" ? "bare" : ""}`}><header><Link href="/review">Reference review</Link><span>{width} × {height}</span>{[320,393,1440].map(w => <Link key={w} href={`/preview?route=${encodeURIComponent(route)}&width=${w}`}>{w}px</Link>)}</header><iframe title="App device preview" src={route} width={width} height={height} style={{width,height,border:0,display:"block"}} /></main>;
}
