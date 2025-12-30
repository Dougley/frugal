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
import { useTranslation } from "react-i18next";
import classes from "./PremiumFeatures.module.css";

export function PremiumFeatures() {
  const { t } = useTranslation();

  const spotlight = [
    {
      titleKey: "premium.features.longerGiveaways.title" as const,
      descriptionKey: "premium.features.longerGiveaways.description" as const,
      icon: IconCalendarBolt,
      compare: {
        freeKey: "premium.features.longerGiveaways.freeValue" as const,
        premiumKey: "premium.features.longerGiveaways.premiumValue" as const,
      },
    },
    {
      titleKey: "premium.features.moreGiveaways.title" as const,
      descriptionKey: "premium.features.moreGiveaways.description" as const,
      icon: IconConfetti,
      compare: {
        freeKey: "premium.features.moreGiveaways.freeValue" as const,
        premiumKey: "premium.features.moreGiveaways.premiumValue" as const,
      },
    },
    {
      titleKey: "premium.features.moreCustomization.title" as const,
      descriptionKey: "premium.features.moreCustomization.description" as const,
      icon: IconPaint,
      compare: {
        freeKey: "premium.features.moreCustomization.freeValue" as const,
        premiumKey: "premium.features.moreCustomization.premiumValue" as const,
      },
    },
    {
      titleKey: "premium.features.moreWinners.title" as const,
      descriptionKey: "premium.features.moreWinners.description" as const,
      icon: IconMoodSmile,
      compare: {
        freeKey: "premium.features.moreWinners.freeValue" as const,
        premiumKey: "premium.features.moreWinners.premiumValue" as const,
      },
    },
  ];

  return (
    <Container className={classes.wrapper}>
      <Title className={classes.title}>{t("premium.features.title")}</Title>

      <Text className={classes.description}>
        {t("premium.features.description")}
      </Text>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        {spotlight.map((feature) => (
          <Paper key={feature.titleKey} radius="md" p="xs">
            <Flex align="center" gap="md">
              <ThemeIcon
                style={{ width: "50px", height: "50px" }}
                variant="light"
                color="teal"
              >
                <feature.icon
                  style={{ width: "50px", height: "50px" }}
                  stroke={2}
                  aria-hidden="true"
                />
              </ThemeIcon>
              <Title order={3}>{t(feature.titleKey)}</Title>
            </Flex>
            <Space h="md" />
            <Flex direction="column" gap="sm">
              <Text>{t(feature.descriptionKey)}</Text>
              {feature.compare && (
                <div>
                  <Text>
                    <Text component="span" fw={700}>
                      {t("premium.features.free")}
                    </Text>{" "}
                    {t(feature.compare.freeKey)}
                  </Text>
                  <Text>
                    <Text component="span" fw={700}>
                      {t("premium.features.premium")}
                    </Text>{" "}
                    {t(feature.compare.premiumKey)}
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
            <IconCode
              style={{ width: "50px", height: "50px" }}
              stroke={2}
              aria-hidden="true"
            />
          </ThemeIcon>
          <Title order={3}>{t("premium.features.andMore.title")}</Title>
        </Flex>
        <Space h="md" />
        <Text>{t("premium.features.andMore.description")}</Text>
      </Paper>
    </Container>
  );
}
