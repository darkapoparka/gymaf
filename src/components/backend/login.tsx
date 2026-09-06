"use client";
import { LoginForm } from "@/features/gymaf/auth-ui";
import { PageHead } from "../primitives";

export function BackendLogin({ onSignedIn, initialError = "", linkMode=false }: { onSignedIn: () => Promise<void>; initialError?: string; linkMode?:boolean }) {
  return <main className="app-shell immersive"><PageHead title="Welcome back" /><div className="flow-page"><h1>Enter your email<br/>to get started.</h1><LoginForm linkMode={linkMode} initialError={initialError} onSignedIn={() => void onSignedIn()} /></div></main>;
}
