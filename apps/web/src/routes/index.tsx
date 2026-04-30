import { Container } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import {
  LandingClosing,
  LandingFeatures,
  LandingHero,
  LandingTestimonials,
} from "~/components/Landing";
import { createMeta } from "~/utils/seo";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: createMeta({
      title: "Discord Giveaway Bot",
      description:
        "Automate your Discord giveaways with GiveawayBot. Easy to use, powerful features, free forever.",
      url: "/",
    }),
  }),
});

function LandingPage() {
  const discordAppId = import.meta.env.VITE_DISCORD_APP_ID;

  return (
    <Container>
      <LandingHero discordAppId={discordAppId} />
      <LandingFeatures />
      <LandingTestimonials />
      <LandingClosing discordAppId={discordAppId} />
    </Container>
  );
}
