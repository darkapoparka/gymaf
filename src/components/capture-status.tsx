"use client";
import { useCapture } from "@/lib/capture-context";

/** The iOS status area belongs only to the screenshot comparison, never the ordinary web app. */
export function CaptureStatus({ light, hidden = false }: { light?: boolean; hidden?: boolean }) {
  const capture = useCapture();
  if (!capture || hidden || capture.ui.chromeHidden) return null;
  return <div className={`capture-status ${light ?? capture.ui.chromeLight ? "light" : ""}`} aria-hidden="true">
    <span>9:41</span>
    <div><svg width="19" height="15" viewBox="0 0 19 15" fill="currentColor"><rect x="0" y="10" width="3" height="5" rx="1"/><rect x="5" y="7" width="3" height="8" rx="1"/><rect x="10" y="3" width="3" height="12" rx="1"/><rect x="15" width="3" height="15" rx="1"/></svg>
      <svg width="19" height="15" viewBox="0 0 20 16" fill="currentColor"><path d="M0 4a16 16 0 0 1 20 0l-2.5 2.6a12.5 12.5 0 0 0-15 0Zm4.2 4.4a9 9 0 0 1 11.6 0l-2.6 2.7a5 5 0 0 0-6.4 0ZM8 13a3 3 0 0 1 4 0l-2 2Z"/></svg>
      <svg width="27" height="14" viewBox="0 0 28 14" fill="none"><rect x=".6" y=".6" width="24.5" height="12.8" rx="3.6" stroke="currentColor" opacity=".45"/><rect x="2.3" y="2.3" width="21.1" height="9.4" rx="2" fill="currentColor"/><path d="M26.5 4.6v4.8c2-.5 2-4.3 0-4.8Z" fill="currentColor" opacity=".5"/></svg>
    </div>
  </div>;
}
