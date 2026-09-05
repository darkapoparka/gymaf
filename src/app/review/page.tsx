import { notFound } from "next/navigation";
import screens from "../../../docs/screen-coverage.json";
import coverage from "../../../docs/coverage.json";
import { ReferenceReview } from "@/components/reference-review";
export default function Review() {
  if (process.env.NODE_ENV !== "development" || process.env.GYMAF_REFERENCE_PREVIEW !== "1") notFound();
  return <ReferenceReview flows={coverage} screens={screens} />;
}
