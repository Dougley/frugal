import { Container } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import {
  PremiumCTA,
  PremiumFAQ,
  PremiumFeatures,
  PremiumHero,
} from "~/components/PremiumPage";
import { createMeta } from "~/utils/seo";

export const Route = createFileRoute("/premium")({
  component: PremiumPage,
  head: () => ({
    meta: createMeta({
      title: "Premium",
      description:
        "Upgrade to Premium for exclusive features and benefits. More winners, longer durations, and priority support.",
      url: "/premium",
    }),
  }),
});

function PremiumPage() {
  const discordAppId = import.meta.env.VITE_DISCORD_APP_ID;

  return (
    <Container>
      <PremiumHero discordAppId={discordAppId} />
      <PremiumFeatures />
      <PremiumFAQ />
      <PremiumCTA discordAppId={discordAppId} />
    </Container>
  );
}
