"use client";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type InputHTMLAttributes } from "react";
import { ChevronLeft, ChevronRight, X, Home, ChartNoAxesColumnIncreasing, CircleUserRound, Users, CalendarDays, Check, MessageCircle } from "lucide-react";
import type { CommandResult, Locale } from "@/shared/gymaf/contracts";
import { validateCommand } from "@/shared/gymaf/validation";
import { api, command } from "./api";

export function useResource<T>(path: string | null) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ path: string | null; data?: T; error?: string }>({ path: null });
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    void api<T>(path, { signal: controller.signal }).then(data => { if (!controller.signal.aborted) setState({ path, data }); }).catch(error => {
      if (!controller.signal.aborted) setState(previous => ({ path, data: previous.path === path ? previous.data : undefined, error: error instanceof Error ? error.message : "Request failed." }));
    });
    return () => controller.abort();
  }, [path, tick]);
  const reload = useCallback(() => setTick(value => value + 1), []);
  // Retain acknowledged data on a failed refresh so unsaved sibling forms are not unmounted.
  // Identity changes/401s are handled by the enclosing session boundary, which hides all private UI.
  const update = (transform: (data: T) => T) => setState(previous => previous.path === path && previous.data !== undefined ? { path, data: transform(previous.data) } : previous);
  return { data: state.path === path ? state.data : undefined, error: state.path === path ? state.error : undefined, reload, update };
}
export function useCommand() {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const running = useRef(false), retry = useRef<{ fingerprint: string; id: string } | null>(null);
  const clearError = useCallback(() => setError(""), []);
  async function run(action: string, payload: Record<string, unknown>): Promise<CommandResult | null> {
    if (running.current) return null;
    running.current = true; setBusy(true); setError("");
    try {
      const fingerprint = JSON.stringify({ action, payload });
      if (retry.current?.fingerprint !== fingerprint) retry.current = { fingerprint, id: crypto.randomUUID() };
      const validated = validateCommand({ action, payload, commandId: retry.current.id });
      const result = await command(validated.action, validated.payload, validated.commandId);
      retry.current = null; return result;
    } catch (failure) { setError(failure instanceof Error ? failure.message : "The operation failed. Retry without changing the fields."); return null; }
    finally { running.current = false; setBusy(false); }
  }
  return { busy, error, run, clearError };
}
export function Copy({ locale, en, bg }: { locale: Locale; en: string; bg: string }) { return locale === "bg" ? bg : en; }
export function Head({ title, back, children }: { title: string; back?: string; children?: ReactNode }) { return <header className={`page-head ${back ? "with-back" : ""}`}>{back && <Link href={back} className="icon-button" aria-label="Back"><ChevronLeft /></Link>}<h1>{title}</h1>{children && <div className="head-actions">{children}</div>}</header>; }
export function Row({ href, children, detail }: { href: string; children: ReactNode; detail?: string }) { return <Link href={href} className="row"><span className="row-copy"><span>{children}</span>{detail && <small>{detail}</small>}</span><ChevronRight size={20} /></Link>; }
export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) { const id = useId(); return <label className="form-field" htmlFor={id}><span>{label}</span><input id={id} {...props} /></label>; }
export function Note({ children }: { children: ReactNode }) { return <p className="note" role="status">{children}</p>; }
export function ErrorNote({ message }: { message?: string }) { return message ? <p className="gymaf-error" role="alert">{message}</p> : null; }
export function Pending({ error, reload }: { error?: string; reload?: () => void }) { return <section className="gymaf-panel" aria-busy={!error}>{error ? <><ErrorNote message={error} />{reload && <button className="button" onClick={reload}>Retry</button>}<Link className="button" href="/login">Sign in</Link></> : <p role="status">Loading…</p>}</section>; }
export function Empty({ children }: { children: ReactNode }) { return <div className="empty-state gymaf-empty"><CalendarDays size={32} /><div>{children}</div></div>; }
export function Dialog({ title, children, onClose, className = "", decoration }: { title: string; children: ReactNode; onClose: () => void; className?: string; decoration?:ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null), titleId = useId();
  useEffect(() => { const dialog = ref.current, trigger = document.activeElement; dialog?.showModal(); return () => { dialog?.close(); if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus(); }; }, []);
  return <dialog ref={ref} className={`sheet ${className}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>{decoration}<div className="sheet-inner"><header><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X /></button><h2 id={titleId}>{title}</h2></header><div className="sheet-content gymaf-stack">{children}</div></div></dialog>;
}
export function Navigation({ area, active, locale, query = "" }: { area: "app" | "coach"; active: string; locale: Locale; query?: string }) {
  const entries = area === "coach" ? [
    ["", "Clients", "Клиенти", Users], ["programs", "Programs", "Програми", CalendarDays], ["reviews", "Reviews", "Прегледи", Check], ["profile", "Profile", "Профил", CircleUserRound],
  ] as const : [
    ["", "Home", "Начало", Home], ["history", "Progress", "Прогрес", ChartNoAxesColumnIncreasing], ["messages", "Messages", "Съобщения", MessageCircle], ["check-ins", "Check-ins", "Отчети", Check], ["profile", "Profile", "Профил", CircleUserRound],
  ] as const;
  return <nav className="bottom-nav" aria-label={locale === "bg" ? "Основна навигация" : "Main navigation"}>{entries.map(([path, en, bg, Icon]) => <Link key={path} href={`/${area}${path ? "/" + path : ""}${query}`} aria-current={active === path ? "page" : undefined}><Icon size={25} /><span>{locale === "bg" ? bg : en}</span></Link>)}</nav>;
}
