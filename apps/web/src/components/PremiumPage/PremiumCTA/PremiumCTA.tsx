import { Button, Text, Title } from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./PremiumCTA.module.css";

interface PremiumCTAProps {
  discordAppId?: string;
}

export function PremiumCTA({ discordAppId }: PremiumCTAProps) {
  const { t } = useTranslation();
  const discordStoreUrl = discordAppId
    ? `https://discord.com/application-directory/${discordAppId}/store`
    : "https://discord.com";

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <Title order={3} className={styles.title}>
          {t("premium.cta.title")}
        </Title>
        <Text className={styles.description}>{t("premium.cta.body")}</Text>
        <Button
          component="a"
          href={discordStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.button}
          variant="gradient"
          gradient={{ from: "amber.4", to: "amber.6" }}
          leftSection={<IconSparkles size={16} aria-hidden="true" />}
        >
          {t("premium.hero.cta")}
        </Button>
      </div>
    </div>
  );
}
