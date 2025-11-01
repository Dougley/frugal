import { Container } from "@mantine/core";
import { useLoaderData } from "react-router";
import { PremiumCTA } from "~/components/PremiumPage/PremiumCTA/PremiumCTA";
import { PremiumFAQ } from "~/components/PremiumPage/PremiumFAQ/PremiumFAQ";
import { PremiumFeatures } from "~/components/PremiumPage/PremiumFeatures/PremiumFeatures";
import { PremiumHero } from "~/components/PremiumPage/PremiumHero/PremiumHero";
import type { Route } from "./+types/premium";

export function loader({ context }: Route.LoaderArgs) {
  const discordAppId = context.cloudflare.env.DISCORD_APP_ID || "";
  return { discordAppId };
}

export default function PremiumPage() {
  const { discordAppId } = useLoaderData<typeof loader>();

  return (
    <Container>
      <PremiumHero discordAppId={discordAppId} />
      <PremiumFeatures />
      <PremiumFAQ />
      <PremiumCTA discordAppId={discordAppId} />
    </Container>
  );
}
