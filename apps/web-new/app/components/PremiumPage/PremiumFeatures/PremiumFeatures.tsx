import {
  Container,
  Flex,
  Paper,
  SimpleGrid,
  Space,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconCalendarBolt,
  IconCode,
  IconConfetti,
  IconMoodSmile,
  IconPaint,
} from "@tabler/icons-react";
import classes from "./PremiumFeatures.module.css";

const spotlight = [
  {
    title: "Longer giveaways",
    description:
      "Create giveaways that last for days, weeks, or even months. The choice is yours.",
    icon: IconCalendarBolt,
    compare: {
      free: "7 days",
      premium: "30 days",
    },
  },
  {
    title: "More giveaways",
    description:
      "Why limit yourself? Create more giveaways and engage your community.",
    icon: IconConfetti,
    compare: {
      free: "5 giveaways",
      premium: "20 giveaways",
    },
  },
  {
    title: "More customization",
    description:
      "Change the color of the embed, add a custom footer, and more.",
    icon: IconPaint,
    compare: {
      free: "Basic",
      premium: "Advanced",
    },
  },
  {
    title: "More winners",
    description:
      "Pick more winners for your giveaways. Give more people a chance to win.",
    icon: IconMoodSmile,
    compare: {
      free: "20 winners",
      premium: "50 winners",
    },
  },
];

export function PremiumFeatures() {
  return (
    <Container className={classes.wrapper}>
      <Title className={classes.title}>Make your giveaways stand out</Title>

      <Text className={classes.description}>
        GiveawayBot Premium offers exclusive features that take your giveaways
        to the next level.
      </Text>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        {spotlight.map((feature) => (
          <Paper key={feature.title} radius="md" p="xs">
            <Flex align="center" gap="md">
              <ThemeIcon
                style={{ width: "50px", height: "50px" }}
                variant="light"
                color="teal"
              >
                <feature.icon
                  style={{ width: "50px", height: "50px" }}
                  stroke={2}
                />
              </ThemeIcon>
              <Title order={3}>{feature.title}</Title>
            </Flex>
            <Space h="md" />
            <Flex direction="column" gap="sm">
              <Text>{feature.description}</Text>
              {feature.compare && (
                <div>
                  <Text>
                    <Text component="span" fw={700}>
                      Free:
                    </Text>{" "}
                    {feature.compare.free}
                  </Text>
                  <Text>
                    <Text component="span" fw={700}>
                      Premium:
                    </Text>{" "}
                    {feature.compare.premium}
                  </Text>
                </div>
              )}
            </Flex>
          </Paper>
        ))}
      </SimpleGrid>
      <Space h="xl" />
      <Paper radius="md" p="xs">
        <Flex align="center" gap="md">
          <ThemeIcon
            style={{ width: "50px", height: "50px" }}
            variant="light"
            color="teal"
          >
            <IconCode style={{ width: "50px", height: "50px" }} stroke={2} />
          </ThemeIcon>
          <Title order={3}>And more!</Title>
        </Flex>
        <Space h="md" />
        <Text>
          Get access to even more features, including early access to new
          features as they're developed.
        </Text>
      </Paper>
    </Container>
  );
}
