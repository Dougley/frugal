import {
  Button,
  Card,
  Flex,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import classes from "./PremiumBanner.module.css";

export function PremiumBanner() {
  const { t } = useTranslation();

  return (
    <Card
      component={Link}
      to="/premium"
      className={classes.banner}
      radius="lg"
      p="lg"
      withBorder
    >
      <Flex align="center" gap="md" className={classes.content}>
        <ThemeIcon
          size={48}
          radius="md"
          variant="gradient"
          gradient={{ from: "yellow", to: "orange" }}
          className={classes.icon}
        >
          <IconSparkles size={26} aria-hidden="true" />
        </ThemeIcon>

        <Stack gap={4} style={{ flex: 1 }} className={classes.textContent}>
          <Group gap="xs">
            <Title order={5} className={classes.title}>
              {t("premium.hero.heading")}
            </Title>
          </Group>

          <Text size="xs" className={classes.description}>
            {t("added.hint")}
          </Text>
        </Stack>

        <Button
          variant="gradient"
          gradient={{ from: "yellow", to: "orange" }}
          size="md"
          className={classes.button}
        >
          {t("added.hintLink")}
        </Button>
      </Flex>
    </Card>
  );
}
