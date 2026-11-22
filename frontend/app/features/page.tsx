import { Metadata } from "next";
import FeaturesPageView from "@/components/features-hub/FeaturesPageView";

export const metadata: Metadata = {
  title: "Features & Modules — ALOA V3",
  description:
    "Explore the 10 autonomous desktop modules of ALOA V3: software management, live system diagnostics, code repairing, cloud deployments, and AI workflows.",
};

export default function FeaturesPage() {
  return <FeaturesPageView />;
}
