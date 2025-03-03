import { Card, Container, SimpleGrid, Text, Title, rem } from "@mantine/core";
import {
  IconBrandDiscord,
  IconBrandGithub,
  IconGauge,
  IconHeartDollar,
  IconLanguage,
  IconLock,
} from "@tabler/icons-react";
import classes from "./LandingFeatures.module.css";

const spotlightFeatures = [
  {
    icon: IconGauge,
    title: "Effortless Giveaways in a Snap",
    description:
      "Create giveaways faster than ever before. No more fumbling with complicated commands.",
  },
  {
    icon: IconBrandDiscord,
    title: "Seamless Discord Integration",
    description:
      "Discord is where you are. GiveawayBot is there too. No need to switch between apps.",
  },
  {
    icon: IconLock,
    title: "Secure and Private",
    description:
      "Your data is yours. We don’t sell your data to third parties, and we don’t store more than we need.",
  },
  {
    icon: IconBrandGithub,
    title: "Open Source",
    description:
      "GiveawayBot is open source. Dive into the code and see how it works. Contribute and make it better.",
  },
  {
    icon: IconHeartDollar,
    title: "Free Forever",
    description:
      "Premium features are available, but the core functionality is free. No hidden fees, no surprises.",
  },
  {
    icon: IconLanguage,
    title: "Multilingual Support",
    description:
      "GiveawayBot speaks your language. And if it doesn’t, you can help us translate it.",
  },
];

export function LandingFeatures() {
  const features = spotlightFeatures.map((feature) => (
    <Card
      key={feature.title}
      shadow="md"
      radius="md"
      className={classes.card}
      padding="xl"
    >
      <feature.icon style={{ width: rem(50), height: rem(50) }} stroke={2} />
      <Text fz="lg" fw={500} className={classes.cardTitle} mt="md">
        {feature.title}
      </Text>
      <Text fz="sm" c="dimmed" mt="sm">
        {feature.description}
      </Text>
    </Card>
  ));

  return (
    <Container className={classes.wrapper}>
      <Title className={classes.title}>Different by design</Title>

      <Container size={560} p={0}>
        <Text size="sm" className={classes.description}>
          GiveawayBot is designed to be easy to use, yet powerful enough to
          handle pretty much any giveaway you can think of.
        </Text>
      </Container>

      <SimpleGrid
        mt={60}
        cols={{ base: 1, sm: 2, md: 3 }}
        spacing={{ base: "xl", md: 50 }}
        verticalSpacing={{ base: "xl", md: 50 }}
      >
        {features}
      </SimpleGrid>
    </Container>
  );
}
