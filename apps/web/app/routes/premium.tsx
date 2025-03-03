import { PremiumCTA } from "~/components/PremiumPage/PremiumCTA/PremiumCTA";
import { PremiumFAQ } from "~/components/PremiumPage/PremiumFAQ/PremiumFAQ";
import { PremiumFeatures } from "~/components/PremiumPage/PremiumFeatures/PremiumFeatures";
import { PremiumHero } from "~/components/PremiumPage/PremiumHero/PremiumHero";

export default function PremiumPage() {
  return (
    <div>
      <PremiumHero />
      <PremiumFeatures />
      <PremiumFAQ />
      <PremiumCTA />
    </div>
  );
}
