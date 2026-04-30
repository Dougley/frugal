import { Button, Group, Text, Title } from "@mantine/core";
import { IconBrandDiscord } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import styles from "./LandingClosing.module.css";

interface LandingClosingProps {
  discordAppId?: string;
}

export function LandingClosing({ discordAppId }: LandingClosingProps) {
  const { t } = useTranslation();
  const discordInviteUrl = discordAppId
    ? `https://discord.com/application-directory/${discordAppId}`
    : "https://discord.com";

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <Title order={3} className={styles.title}>
          {t("landing.closing.heading")}
        </Title>
        <Text className={styles.description}>{t("landing.closing.body")}</Text>
        <Group justify="center">
          <Button
            component={Link}
            to="/wiki/getting-started/quick-start"
            className={styles.button}
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
            className={styles.button}
            variant="light"
            leftSection={<IconBrandDiscord size={18} aria-hidden="true" />}
          >
            {t("landing.hero.addToDiscord")}
          </Button>
        </Group>
      </div>
    </div>
  );
}
