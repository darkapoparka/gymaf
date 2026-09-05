"use client";
import Image from "next/image";
import { Flame, Share2, Timer } from "lucide-react";
import { useState } from "react";
import { Photo, Sheet } from "./primitives";
export function AchievementDialog({ onClose }: { onClose: () => void }) {
  const [notice, setNotice] = useState("");
  return <Sheet title="Achievement" className="achievement-dialog" onClose={onClose}>
    <Image src="/brand/wordmark.svg" alt="future Pro" width={160} height={42} />
    <Photo crop={{ src: "screens/06b4af20ce799415.webp", sw: 902, sh: 2048, x: 213, y: 455, w: 478, h: 478 }} alt="500 calories achievement badge" />
    <h2>Congrats Alex!</h2><p>You’ve burned over 500 calories.</p>
    <div className="achievement-totals"><p><Timer />130+ minutes</p><p><Flame />750+ calories</p></div>
    <button className="button" onClick={async () => { try { await navigator.clipboard.writeText(window.location.origin + "/profile"); setNotice("Link Copied"); } catch { setNotice("Copy the profile address from your browser."); } }}><Share2 />Share</button><span role="status">{notice}</span>
  </Sheet>;
}
