import { notFound } from "next/navigation";
import { CoachPublicPage } from "@/features/gymaf/public-pages";
import { rpc } from "@/server/gymaf/http";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) notFound();
  const coach = await rpc("gymaf_public_coach", { p_slug:slug }) as { public_name: string; bio: string; slug: string } | null;
  if (!coach) notFound();
  return <CoachPublicPage coach={coach} />;
}
