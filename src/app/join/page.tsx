import { JoinPage } from "@/features/gymaf/auth-ui";
export default function Page() { return <JoinPage linkMode={process.env.GYMAF_EMAIL_AUTH_MODE === "link"} />; }
