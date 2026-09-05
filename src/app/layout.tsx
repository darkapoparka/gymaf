import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./flows.css";
import "./fidelity.css";

const sans = localFont({ src: [
  { path: "../../public/fonts/sf-pro-text.woff2", weight: "400", style: "normal" },
  { path: "../../public/fonts/sf-pro-medium.woff2", weight: "500", style: "normal" },
], variable: "--font-native", display: "swap" });
const serif = localFont({ src: [
  { path: "../../public/fonts/season-mix-regular.woff2", weight: "400", style: "normal" },
  { path: "../../public/fonts/season-mix-medium.woff2", weight: "500", style: "normal" },
], variable: "--font-season", display: "swap" });

export const metadata: Metadata = {
  title: "Future Pro",
  description:
    "Personal coaching, reimagined. Future Pro web interface reference implementation.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f1f0f6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <template id="design-contract" dangerouslySetInnerHTML={{ __html: `<!--
THESIS: Recreate the user-pinned Future Pro iOS Mobbin collection as an interactive web app.
OWN-WORLD: Lavender sheets, source photography, Future emblems, serif display roles and native sans controls.
STORY: Choose a coach, train, review progress, communicate and manage a plan.
FIRST VIEWPORT: Match each selected 393px mobile source composition; desktop adapts the same hierarchy.
FORM: Operate; user-pinned-reference-future-pro-f4ddb8cd. No randomized replacement of the supplied design.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->` }} />
        {children}
      </body>
    </html>
  );
}
