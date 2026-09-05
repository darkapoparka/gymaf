import { ConnectedApp } from "@/features/gymaf/connected-app";
export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{ path?: string[] }>; searchParams: Promise<{ workspace?: string }> }) {
  const [route,query] = await Promise.all([params,searchParams]);
  return <ConnectedApp area="coach" path={route.path || []} workspaceId={typeof query.workspace === "string" ? query.workspace : undefined} />;
}
