"use client";
import NextLink from "next/link";
import { useRouter as useNextRouter } from "next/navigation";
import { useMemo, type ComponentProps } from "react";
import { useCapture } from "@/lib/capture-context";

export function captureHref(href: string, id?: string) {
  if (!id || !href.startsWith("/") || href.startsWith("//") || /^\/(review|preview)([/?#]|$)/.test(href)) return href;
  const url = new URL(href, "http://local.invalid");
  url.searchParams.set("capture", id);
  return url.pathname + url.search + url.hash;
}
export default function CaptureLink({ href, ...props }: ComponentProps<typeof NextLink>) {
  const capture = useCapture();
  return <NextLink {...props} href={typeof href === "string" ? captureHref(href, capture?.id) : href} />;
}
export function useAppRouter() {
  const router = useNextRouter();
  const capture = useCapture();
  const id = capture?.id;
  return useMemo(() => ({
    ...router,
    push: (href: string, options?: Parameters<typeof router.push>[1]) => router.push(captureHref(href, id), options),
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => router.replace(captureHref(href, id), options),
  }), [router, id]);
}
