"use client";
import NextLink from "next/link";
import { useRouter as useNextRouter } from "next/navigation";
import { useMemo, type ComponentProps } from "react";
import { useCapture } from "@/lib/capture-context";
import { useBackend } from '@/lib/backend/context';

function relationshipHref(href:string, relationshipId?:string, connected=false) {
  if (connected && /^\/coaches(?:\/|\?|$)/.test(href)) href='/app'+href;
  if (!relationshipId || !href.startsWith('/') || href.startsWith('//') || /^\/(api|coach|operator|login|security)(\/|$)/.test(href)) return href;
  const url=new URL(href,'http://local.invalid');
  if (!url.searchParams.has('relationship')) url.searchParams.set('relationship',relationshipId);
  return url.pathname+url.search+url.hash;
}

export function captureHref(href: string, id?: string) {
  if (!id || !href.startsWith("/") || href.startsWith("//") || /^\/(review|preview)([/?#]|$)/.test(href)) return href;
  const url = new URL(href, "http://local.invalid");
  url.searchParams.set("capture", id);
  return url.pathname + url.search + url.hash;
}
export default function CaptureLink({ href, ...props }: ComponentProps<typeof NextLink>) {
  const capture = useCapture();
  const backend=useBackend();
  return <NextLink {...props} href={typeof href === "string" ? captureHref(relationshipHref(href,backend?.relationship?.relationship.id,!!backend), capture?.id) : href} />;
}
export function useAppRouter() {
  const router = useNextRouter();
  const capture = useCapture();
  const backend=useBackend(), relationshipId=backend?.relationship?.relationship.id, connected=!!backend;
  const id = capture?.id;
  return useMemo(() => ({
    ...router,
    push: (href: string, options?: Parameters<typeof router.push>[1]) => router.push(captureHref(relationshipHref(href,relationshipId,connected), id), options),
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => router.replace(captureHref(relationshipHref(href,relationshipId,connected), id), options),
  }), [router, id, relationshipId, connected]);
}
