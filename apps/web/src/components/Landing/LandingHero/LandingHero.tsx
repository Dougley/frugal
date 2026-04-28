import { Button, Container, Group, Text } from "@mantine/core";
import { IconBrandDiscord } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Dots } from "./Dots";
import classes from "./LandingHero.module.css";

interface LandingHeroProps {
  discordAppId?: string;
}

export function LandingHero({ discordAppId }: LandingHeroProps) {
  const { t } = useTranslation();
  const discordInviteUrl = discordAppId
    ? `https://discord.com/application-directory/${discordAppId}`
    : "https://discord.com";

  return (
    <Container className={classes.wrapper}>
      <Dots className={classes.dots} style={{ left: 30, top: 30 }} />
      <Dots className={classes.dots} style={{ left: 90, top: 30 }} />
      <Dots className={classes.dots} style={{ left: 30, top: 170 }} />
      <Dots className={classes.dots} style={{ right: 30, top: 90 }} />

      <Container size={700} className={classes.inner}>
        <h1 className={classes.title}>
          {t("landing.hero.heading")}{" "}
          <Text
            component="span"
            gradient={{ from: "indigo.4", to: "indigo.7" }}
            variant="gradient"
            inherit
          >
            {t("common.brand")}
          </Text>
        </h1>

        <Text className={classes.description}>{t("landing.hero.body")}</Text>

        <Group className={classes.controls}>
          <Button
            component={Link}
            to="/wiki/getting-started/quick-start"
            size="xl"
            className={classes.control}
            variant="gradient"
            gradient={{ from: "indigo.5", to: "indigo.7" }}
          >
            {t("landing.hero.cta")}
          </Button>
          <Button
            component="a"
            href={discordInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="xl"
            className={classes.control}
            variant="light"
            leftSection={<IconBrandDiscord size={20} aria-hidden="true" />}
          >
            {t("landing.hero.addToDiscord")}
          </Button>
        </Group>
      </Container>
    </Container>
  );
}
