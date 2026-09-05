"use client";
import { useEffect, useRef, useId, type ReactNode, type CSSProperties } from "react";
import Image from "next/image";
import Link from "./capture-link";
import {
  ChevronLeft,
  X,
  ChevronRight,
  Home,
  ChartNoAxesColumnIncreasing,
  Users,
  CircleUserRound,
  Dumbbell,
  Bike,
  Footprints,
  PersonStanding,
  Accessibility,
  Mountain,
  type LucideIcon,
} from "lucide-react";
import { useCapture } from "@/lib/capture-context";
import { media, type Crop } from "@/lib/data";

// Only the photographic region is displayed; interface text and controls are rendered as HTML.
export function Photo({
  crop,
  alt = "",
  className = "",
  priority = false,
}: {
  crop: Crop;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const style: CSSProperties = { aspectRatio: `${crop.w}/${crop.h}` };
  return (
    <span className={"photo " + className} style={style}>
      <Image
        src={"/reference/" + crop.src}
        alt={alt}
        width={crop.sw}
        height={crop.sh}
        unoptimized
        loading={priority ? "eager" : "lazy"}
        draggable={false}
        style={{
          width: `${(crop.sw / crop.w) * 100}%`,
          maxWidth: "none",
          height: `${(crop.sh / crop.h) * 100}%`,
          left: `${(-crop.x / crop.w) * 100}%`,
          top: `${(-crop.y / crop.h) * 100}%`,
        }}
      />
    </span>
  );
}
export function Avatar({
  person = "lee",
  size = 32,
}: {
  person?: "lee" | "alex";
  size?: number;
}) {
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      <Photo
        crop={media[person]}
        alt={person === "lee" ? "Coach Lee" : "Alex Smith"}
      />
    </span>
  );
}
export function IconButton({
  label,
  children,
  onClick,
  className = "",
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={"icon-button " + className}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function Back({
  href = "/",
  label = "Back",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link className="icon-button" href={href} aria-label={label}>
      <ChevronLeft size={23} />
    </Link>
  );
}
export function PageHead({
  title,
  back,
  children,
}: {
  title: string;
  back?: string;
  children?: ReactNode;
}) {
  return (
    <header className={"page-head " + (back ? "with-back" : "")}>
      {back && <Back href={back} />}
      <h1>{title}</h1>
      {children && <div className="head-actions">{children}</div>}
    </header>
  );
}
export function Row({
  children,
  detail,
  onClick,
  href,
  icon,
}: {
  children: ReactNode;
  detail?: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
}) {
  const content = (
    <>
      {icon && <span className="row-icon">{icon}</span>}
      <span className="row-copy">
        <span>{children}</span>
        {detail && <small>{detail}</small>}
      </span>
      <ChevronRight size={20} />
    </>
  );
  return href ? (
    <Link className="row" href={href}>
      {content}
    </Link>
  ) : (
    <button type="button" className="row" onClick={onClick}>
      {content}
    </button>
  );
}
export function Sheet({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog?.showModal();
    dialog?.focus({preventScroll:true});
    return () => {
      dialog?.close();
      queueMicrotask(() => {
        if (trigger?.isConnected) trigger.focus();
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      className={"sheet " + className}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby={titleId}
    >
      <div className="sheet-inner">
        <header>
          <IconButton label="Close" onClick={onClose}>
            <X />
          </IconButton>
          <h2 id={titleId}>{title}</h2>
        </header>
        <div className="sheet-content">{children}</div>
      </div>
    </dialog>
  );
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="tabs" role="group">
      {items.map((item) => (
        <button
          type="button"
          key={item}
          aria-pressed={value === item}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
const navItems: [string, string, LucideIcon][] = [
  ["", "Home", Home],
  ["progress", "Progress", ChartNoAxesColumnIncreasing],
  ["messages", "Messages", CircleUserRound],
  ["friends", "Friends", Users],
  ["profile", "Profile", CircleUserRound],
];
export function Navigation({ path }: { path: string }) {
  const capture = useCapture();
  const active = path.split("/")[0];
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map(([href, label]) => (
        <Link
          href={"/" + href}
          aria-label={label}
          aria-current={active === href ? "page" : undefined}
          key={label}
        >
          {label === "Messages" ? (
            <Avatar size={27} />
          ) : (
            <NavGlyph name={label} />
          )}
          <span>{label}</span>
          {label === "Messages" && Number(capture?.ui.unreadMessages)>0 && <b className="nav-unread">{Number(capture?.ui.unreadMessages)}</b>}
        </Link>
      ))}
    </nav>
  );
}
function NavGlyph({ name }: { name: string }) {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 28 28"
      fill="currentColor"
      aria-hidden="true"
    >
      {name === "Home" ? (
        <>
          <path d="M3 13 14 3l11 10v12H3zm8 4v8h6v-8z" fillRule="evenodd" />
          <path
            d="M1 12 14 1l13 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
          />
        </>
      ) : name === "Progress" ? (
        <>
          <rect x="3" y="10" width="5" height="14" rx="1" />
          <rect x="10" y="3" width="5" height="21" rx="1" />
          <rect x="17" y="7" width="4" height="17" rx="1" />
          <rect x="23" y="13" width="3" height="11" rx="1" />
          <path d="M1 27h27" stroke="currentColor" strokeWidth="2" />
        </>
      ) : name === "Friends" ? (
        <>
          <circle cx="14" cy="7" r="4" />
          <circle cx="4" cy="8" r="3" />
          <circle cx="24" cy="8" r="3" />
          <path d="M7 24c0-6 2-10 7-10s7 4 7 10H7M0 23v-5c0-4 4-5 7-3-2 3-2 6-2 8H0M28 23v-5c0-4-4-5-7-3 2 3 2 6 2 8h5" />
        </>
      ) : (
        <>
          <circle cx="14" cy="14" r="13" />
          <circle cx="14" cy="10" r="4" fill="#f6f5f8" />
          <path d="M6 22c1-7 15-7 16 0-5 4-11 4-16 0" fill="#f6f5f8" />
        </>
      )}
    </svg>
  );
}
const activities: [string, LucideIcon, string][] = [
  ["Strength", Dumbbell, "/workouts"],
  ["Running", Footprints, "/workouts/running"],
  ["Cycling", Bike, "/workouts?activity=Cycling"],
  ["Flexibility", PersonStanding, "/workouts/morning-yoga"],
  ["Core", Accessibility, "/workouts/picks"],
  ["Hiking", Mountain, "/workouts?activity=Hiking"],
];
export function ActivityStrip() {
  return (
    <section className="activity-strip">
      <Link href="/workouts" className="strip-title">
        More workouts
      </Link>
      <div>
        {activities.map(([name, , href], i) => (
          <Link href={href} key={name} title={name} aria-label={name}>
            <Photo
              crop={{
                src: "home.webp",
                sw: 903,
                sh: 2048,
                x: 72 + i * 137,
                y: 1357,
                w: 114,
                h: 115,
              }}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
export function Rings({
  active = false,
  size = 50,
}: {
  active?: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      role="img"
      aria-label={active ? "18 active minutes" : "No recorded activity"}
    >
      <circle
        cx="30"
        cy="30"
        r="24"
        fill="none"
        stroke="#ebdce5"
        strokeWidth="6"
      />
      <circle
        cx="30"
        cy="30"
        r="17"
        fill="none"
        stroke="#dcefdc"
        strokeWidth="6"
      />
      <circle
        cx="30"
        cy="30"
        r="10"
        fill="none"
        stroke="#dbeaf2"
        strokeWidth="6"
      />
      {active && (
        <circle
          cx="30"
          cy="30"
          r="17"
          fill="none"
          stroke="#85d641"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="65 110"
          transform="rotate(-90 30 30)"
        />
      )}
    </svg>
  );
}
