import { Button, Container, Group, Text } from "@mantine/core";
import { Dots } from "./Dots";
import classes from "./PremiumHero.module.css";

export function PremiumHero() {
  return (
    <Container className={classes.wrapper}>
      <Dots className={classes.dots} style={{ left: 30, top: 30 }} />
      <Dots className={classes.dots} style={{ left: 90, top: 30 }} />
      <Dots className={classes.dots} style={{ left: 30, top: 170 }} />
      <Dots className={classes.dots} style={{ right: 30, top: 90 }} />

      <Container size={700} className={classes.inner}>
        <h1 className={classes.title}>
          GiveawayBot{" "}
          <Text
            gradient={{ from: "blue", to: "green" }}
            variant="gradient"
            inherit
          >
            Premium
          </Text>
        </h1>
        <Text className={classes.description}>
          Go above and beyond with GiveawayBot Premium. Unlock exclusive
          features and support the bot's development.
        </Text>
        <Group className={classes.controls}>
          <Button
            size="xl"
            className={classes.control}
            variant="gradient"
            gradient={{ from: "teal", to: "cyan" }}
          >
            Subscribe via Discord
          </Button>
        </Group>
      </Container>
    </Container>
  );
}
