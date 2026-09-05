import { LoginPage } from "@/features/gymaf/auth-ui";
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const messages: Record<string, string> = {
    "invalid-link": "This sign-in link is invalid, expired or already used. Request a new link below.",
    "different-browser": "Open the newest sign-in link in the same browser where you requested it. Or request a new link in this browser.",
    unavailable: "Sign-in could not finish because the service is unavailable. Please request a new link and try again.",
  };
  return <LoginPage linkMode={process.env.GYMAF_EMAIL_AUTH_MODE === "link"} initialError={error && Object.hasOwn(messages, error) ? messages[error] : ""} />;
}
