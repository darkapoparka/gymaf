"use client";
import { type ReactNode, useState } from "react";
import Link from "./capture-link";
import { ChevronLeft, X, Check, ChevronRight } from "lucide-react";
import { useLocalData } from "@/lib/store";

export function usePreferences() {
  const { data, update } = useLocalData();
  return {
    data,
    update,
    get: (key: string, fallback = "") => data.preferences[key] ?? fallback,
    set: (key: string, value: string) =>
      update((s) => ({ preferences: { ...s.preferences, [key]: value } })),
    setMany: (values: Record<string, string>) =>
      update((s) => ({ preferences: { ...s.preferences, ...values } })),
  };
}
export function FlowHead({
  title,
  back = "/",
  close = false,
  action,
}: {
  title: string;
  back?: string;
  close?: boolean;
  action?: ReactNode;
}) {
  return (
    <header className="flow-head">
      <Link
        href={back}
        className="icon-button"
        aria-label={close ? "Close" : "Back"}
      >
        {close ? <X /> : <ChevronLeft />}
      </Link>
      <h1>{title}</h1>
      <span>{action}</span>
    </header>
  );
}
export function FlowFooter({
  back,
  next,
  label = "Continue",
  disabled = false,
  onNext,
}: {
  back: string;
  next?: string;
  label?: string;
  disabled?: boolean;
  onNext?: () => void;
}) {
  return (
    <footer className="flow-footer">
      <Link href={back}>Back</Link>
      {next && !disabled ? (
        <Link className="button primary" href={next} onClick={onNext}>
          {label}
        </Link>
      ) : (
        <button className="button primary" disabled={disabled} onClick={onNext}>
          {label}
        </button>
      )}
    </footer>
  );
}
export function Choices({
  items,
  value,
  onChange,
  multiple = false,
  className = "",
}: {
  items: string[];
  value: string | string[];
  onChange: (v: string) => void;
  multiple?: boolean;
  className?: string;
}) {
  return (
    <div className={"choice-list " + className} role="group">
      {items.map((item) => {
        const checked = Array.isArray(value)
          ? value.includes(item)
          : value === item;
        return (
          <button
            type="button"
            className={checked ? "selected" : ""}
            key={item}
            aria-pressed={checked}
            onClick={() => onChange(item)}
          >
            <span>{item}</span>
            <span className={multiple ? "choice-check" : "choice-radio"}>
              {checked && <Check size={17} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
export function Chips({
  items,
  selected,
  onChange,
}: {
  items: string[];
  selected: string[];
  onChange: (item: string) => void;
}) {
  return (
    <div className="flow-chips">
      {items.map((item) => (
        <button
          key={item}
          className={selected.includes(item) ? "selected" : ""}
          aria-pressed={selected.includes(item)}
          onClick={() => onChange(item)}
        >
          {item}
          {selected.includes(item) ? <X size={13} /> : null}
        </button>
      ))}
    </div>
  );
}
export function Toggle({
  label,
  description,
  pref,
  defaultOn = false,
}: {
  label: string;
  description?: string;
  pref: string;
  defaultOn?: boolean;
}) {
  const { get, set } = usePreferences();
  const enabled = get(pref, defaultOn ? "true" : "false") === "true";
  return (
    <div className="flow-setting">
      <label className="switch-row">
        <span>{label}</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => set(pref, String(e.target.checked))}
        />
      </label>
      {description && <p>{description}</p>}
    </div>
  );
}
export type FieldSpec = {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  value?: string;
  min?: string;
  max?: string;
};
export function Fields({
  fields,
  onSave,
  label = "Save",
  children,
}: {
  fields: FieldSpec[];
  onSave: (values: Record<string, string>) => void | Promise<void>;
  label?: string;
  children?: ReactNode;
}) {
  const { get } = usePreferences();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="flow-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (saving) return;
        const values = Object.fromEntries(
          new FormData(e.currentTarget),
        ) as Record<string, string>;
        if (fields.some((f) => f.required && !values[f.key]?.trim())) {
          setError("Please complete the required fields.");
          return;
        }
        setSaving(true);
        try { await onSave(values); } catch { setError('Your changes could not be saved. Please retry.'); } finally { setSaving(false); }
      }}
    >
      {fields.map((f) => (
        <label className="form-field" key={f.key}>
          {f.label}
          {f.options ? (
            <select
              name={f.key}
              defaultValue={get(f.key, f.value ?? f.options[0])}
            >
              {f.options.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              name={f.key}
              required={f.required}
              placeholder={f.placeholder}
              defaultValue={get(f.key, f.value)}
            />
          ) : (
            <input
              name={f.key}
              type={f.type ?? "text"}
              required={f.required}
              min={f.min}
              max={f.max}
              placeholder={f.placeholder}
              defaultValue={get(f.key, f.value)}
              autoComplete="off"
            />
          )}
        </label>
      ))}
      {children}
      {error && <p role="alert">{error}</p>}
      <button className="button primary full" disabled={saving}>{saving ? "Saving…" : label}</button>
    </form>
  );
}
export function FlowRow({
  label,
  detail,
  href,
  onClick,
}: {
  label: string;
  detail?: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span>{label}</span>
      <span className="flow-row-detail">
        {detail}
        <ChevronRight size={18} />
      </span>
    </>
  );
  return href ? (
    <Link className="flow-row" href={href}>
      {content}
    </Link>
  ) : (
    <button className="flow-row" onClick={onClick}>
      {content}
    </button>
  );
}
