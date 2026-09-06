import { BackendProvider } from "@/lib/backend/context";
import { FutureApp } from "@/components/future-app";
export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{ path?: string[] }>; searchParams: Promise<{ relationship?: string }> }) {
  const [route,query] = await Promise.all([params,searchParams]);
  return <BackendProvider linkMode={process.env.GYMAF_EMAIL_AUTH_MODE === 'link'} relationshipId={typeof query.relationship === "string" ? query.relationship : undefined}><FutureApp path={(route.path || []).join('/')} /></BackendProvider>;
}
