import screens from "../../../docs/screen-coverage.json";
import coverage from "../../../docs/coverage.json";
import { ReferenceReview } from "@/components/reference-review";
export default function Review() {
  return <ReferenceReview flows={coverage} screens={screens} />;
}
