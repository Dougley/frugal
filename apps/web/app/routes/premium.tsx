import { PremiumCTA } from "~/components/PremiumPage/PremiumCTA/PremiumCTA";
import { PremiumFAQ } from "~/components/PremiumPage/PremiumFAQ/PremiumFAQ";
import { PremiumFeatures } from "~/components/PremiumPage/PremiumFeatures/PremiumFeatures";
import { PremiumHero } from "~/components/PremiumPage/PremiumHero/PremiumHero";

import type { Route } from "./+types/premium";

export async function loader({ context }: Route.LoaderArgs) {
  const { drizzle } = context;
  const users = await drizzle.query.entries.findMany({
    limit: 10,
  });
  return users;
}

export default function PremiumPage({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <pre>{JSON.stringify(loaderData, null, 2)}</pre>
      <PremiumHero />
      <PremiumFeatures />
      <PremiumFAQ />
      <PremiumCTA />
    </div>
  );
}
