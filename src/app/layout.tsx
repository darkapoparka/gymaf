import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./flows.css";
import "./fidelity.css";
import "./gymaf.css";

// Retained only to preserve the existing local visual baseline. Font rights and
// Bulgarian/native coverage remain explicit release gates in astra/DESIGN_CONTENT.md.
const sans = localFont({ src: [
  { path: "../../public/fonts/sf-pro-text.woff2", weight: "400", style: "normal" },
  { path: "../../public/fonts/sf-pro-medium.woff2", weight: "500", style: "normal" },
], variable: "--font-native", display: "swap" });
const serif = localFont({ src: [
  { path: "../../public/fonts/season-mix-regular.woff2", weight: "400", style: "normal" },
  { path: "../../public/fonts/season-mix-medium.woff2", weight: "500", style: "normal" },
], variable: "--font-season", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Gymaf", template: "%s · Gymaf" },
  description: "Training plans, workout logs and feedback from your coach.",
  // This branch is a validation build, not an approved public release.
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f1f0f6",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${sans.variable} ${serif.variable}`}><body>{children}</body></html>;
}
