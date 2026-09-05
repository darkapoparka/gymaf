import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty-page">
      <h1>Let’s get you back.</h1>
      <p>This page isn’t available.</p>
      <Link className="button primary" href="/">
        Back to Home
      </Link>
    </main>
  );
}
