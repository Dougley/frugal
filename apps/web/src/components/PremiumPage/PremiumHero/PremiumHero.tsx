import { Button, Container, Group, Text } from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Dots } from "./Dots";
import classes from "./PremiumHero.module.css";

interface PremiumHeroProps {
  discordAppId?: string;
}

export function PremiumHero({ discordAppId }: PremiumHeroProps) {
  const { t } = useTranslation();
  const discordStoreUrl = discordAppId
    ? `https://discord.com/application-directory/${discordAppId}/store`
    : "https://discord.com";

  return (
    <Container className={classes.wrapper}>
      <Dots className={classes.dots} style={{ left: 30, top: 30 }} />
      <Dots className={classes.dots} style={{ left: 90, top: 30 }} />
      <Dots className={classes.dots} style={{ left: 30, top: 170 }} />
      <Dots className={classes.dots} style={{ right: 30, top: 90 }} />

      <Container size={700} className={classes.inner}>
        <h1 className={classes.title}>
          {t("common.brand")}{" "}
          <Text
            gradient={{ from: "amber.4", to: "amber.6" }}
            variant="gradient"
            inherit
          >
            {t("premium.hero.heading")}
          </Text>
        </h1>
        <Text className={classes.description}>{t("premium.hero.body")}</Text>
        <Group className={classes.controls}>
          <Button
            component="a"
            href={discordStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="xl"
            className={classes.control}
            variant="gradient"
            gradient={{ from: "amber.4", to: "amber.6" }}
            leftSection={<IconSparkles size={20} aria-hidden="true" />}
          >
            {t("premium.hero.cta")}
          </Button>
        </Group>
      </Container>
    </Container>
  );
}
