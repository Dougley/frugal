import { Container, Stack } from "@mantine/core";
import { useLoaderData } from "react-router";
import { useAuth } from "~/components/contexts/AuthContext";
import { PremiumCTA } from "~/components/PremiumPage/PremiumCTA/PremiumCTA";
import { PremiumFAQ } from "~/components/PremiumPage/PremiumFAQ/PremiumFAQ";
import { PremiumFeatures } from "~/components/PremiumPage/PremiumFeatures/PremiumFeatures";
import { PremiumHero } from "~/components/PremiumPage/PremiumHero/PremiumHero";
import { SubscriptionStatus } from "~/components/SubscriptionStatus";
import type { Route } from "./+types/premium";

export function loader({ context }: Route.LoaderArgs) {
  const discordAppId = context.cloudflare.env.DISCORD_APP_ID || "";
  return { discordAppId };
}

export default function PremiumPage() {
  const { discordAppId } = useLoaderData<typeof loader>();
  const { isAuthenticated } = useAuth();

  return (
    <Container>
      <PremiumHero discordAppId={discordAppId} />

      {/* Show subscription status for authenticated users */}
      {isAuthenticated && (
        <Stack gap="lg" mt="xl" mb="xl">
          <SubscriptionStatus
            showUpgradeButton
            showLimits
            discordAppId={discordAppId}
          />
        </Stack>
      )}

      <PremiumFeatures />
      <PremiumFAQ />
      <PremiumCTA discordAppId={discordAppId} />
    </Container>
  );
}
