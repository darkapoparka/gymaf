import { ConnectedApp } from "@/features/gymaf/connected-app";
export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{ path?: string[] }>; searchParams: Promise<{ relationship?: string }> }) {
  const [route,query] = await Promise.all([params,searchParams]);
  return <ConnectedApp area="app" path={route.path || []} relationshipId={typeof query.relationship === "string" ? query.relationship : undefined} />;
}
