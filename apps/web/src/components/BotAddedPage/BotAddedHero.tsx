import {
  Button,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconBook,
  IconBrandDiscord,
  IconCalendar,
  IconCircleCheck,
  IconCode,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Dots } from "~/components/Landing/LandingHero/Dots";
import classes from "./BotAddedHero.module.css";
import { PremiumBanner } from "./PremiumBanner";

export function BotAddedHero() {
  const { t } = useTranslation();

  return (
    <Container className={classes.wrapper}>
      <Dots className={classes.dots} style={{ left: 30, top: 30 }} />
      <Dots className={classes.dots} style={{ left: 90, top: 30 }} />
      <Dots className={classes.dots} style={{ left: 30, top: 170 }} />
      <Dots className={classes.dots} style={{ right: 30, top: 90 }} />

      <Container size={600} className={classes.inner}>
        <Stack align="center" gap="md">
          <ThemeIcon
            size={72}
            radius="xl"
            variant="gradient"
            gradient={{ from: "teal", to: "lime" }}
            className={classes.icon}
          >
            <IconCircleCheck size={48} aria-hidden="true" />
          </ThemeIcon>

          <h1 className={classes.title}>{t("added.title")}</h1>

          <Text className={classes.description}>{t("added.description")}</Text>

          <SimpleGrid cols={{ base: 1, sm: 3 }} className={classes.steps}>
            <Stack gap={4} align="center">
              <ThemeIcon size={36} radius="md" variant="light" color="teal">
                <IconCode size={20} aria-hidden="true" />
              </ThemeIcon>
              <Text size="xs" className={classes.stepNumber}>
                Step 1
              </Text>
              <Text size="sm" ta="center">
                {t("added.nextSteps.step1")}
              </Text>
              <Text
                size="xs"
                c="dimmed"
                fw={700}
                style={{ fontFamily: "monospace" }}
              >
                /start
              </Text>
            </Stack>

            <Stack gap={4} align="center">
              <ThemeIcon size={36} radius="md" variant="light" color="teal">
                <IconCalendar size={20} aria-hidden="true" />
              </ThemeIcon>
              <Text size="xs" className={classes.stepNumber}>
                Step 2
              </Text>
              <Text size="sm" ta="center">
                {t("added.nextSteps.step2")}
              </Text>
            </Stack>

            <Stack gap={4} align="center">
              <ThemeIcon size={36} radius="md" variant="light" color="teal">
                <IconBrandDiscord size={20} aria-hidden="true" />
              </ThemeIcon>
              <Text size="xs" className={classes.stepNumber}>
                Step 3
              </Text>
              <Text size="sm" ta="center">
                {t("added.nextSteps.step3")}
              </Text>
            </Stack>
          </SimpleGrid>

          <Group className={classes.controls}>
            <Button
              component={Link}
              to="/wiki/getting-started/quick-start"
              size="md"
              className={classes.control}
              variant="default"
              leftSection={<IconBook size={18} aria-hidden="true" />}
            >
              {t("added.actions.readGuide")}
            </Button>
            <Button
              component="a"
              href="discord://-/"
              size="md"
              className={classes.control}
              variant="gradient"
              gradient={{ from: "blue", to: "cyan" }}
              leftSection={<IconBrandDiscord size={18} aria-hidden="true" />}
            >
              {t("added.actions.openDiscord")}
            </Button>
          </Group>

          <PremiumBanner />
        </Stack>
      </Container>
    </Container>
  );
}
