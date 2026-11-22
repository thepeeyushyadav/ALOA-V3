import type { Metadata } from "next";
import PricingPageView from "@/components/pricing/PricingPageView";

export const metadata: Metadata = {
  title: "Pricing & Plans | ALOA V3",
  description:
    "Explore transparent pricing for ALOA V3. Start with an unrestricted 30-day free trial. Flexible plans for 1 month ($9), 3 months ($21), 6 months ($41), and 1 year ($89).",
};

export default function PricingPage() {
  return <PricingPageView />;
}
