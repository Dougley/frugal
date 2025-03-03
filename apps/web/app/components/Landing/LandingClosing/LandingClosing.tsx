import { Button, Text, Title } from "@mantine/core";
import styles from "./LandingClosing.module.css";

export function LandingClosing() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <Title order={3} className={styles.title}>
          Ready to get started?
        </Title>
        <Text className={styles.description}>
          Focus on your community, not on managing giveaways. GiveawayBot is
          here to help.
        </Text>
        <Button
          className={styles.button}
          variant="gradient"
          gradient={{ from: "blue", to: "cyan" }}
        >
          Get started
        </Button>
      </div>
    </div>
  );
}
