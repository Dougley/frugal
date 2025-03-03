import { Button, Text, Title } from "@mantine/core";
import styles from "./PremiumCTA.module.css";

export function PremiumCTA() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <Title order={3} className={styles.title}>
          What are you waiting for?
        </Title>
        <Text className={styles.description}>
          Elevate your giveaways with GiveawayBot Premium.
        </Text>
        <Button
          className={styles.button}
          variant="gradient"
          gradient={{ from: "blue", to: "cyan" }}
        >
          Subscribe via Discord
        </Button>
      </div>
    </div>
  );
}
