import { Container } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { BotAddedHero } from "~/components/BotAddedPage";
import { createMeta } from "~/utils/seo";

export const Route = createFileRoute("/added")({
  component: BotAddedPage,
  head: () => ({
    meta: createMeta({
      title: "Bot Added Successfully",
      description:
        "GiveawayBot has been added to your server. Learn how to get started with your first giveaway.",
      url: "/added",
    }),
  }),
});

function BotAddedPage() {
  return (
    <Container>
      <BotAddedHero />
    </Container>
  );
}
