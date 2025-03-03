import { Button, Container, Group, Text } from "@mantine/core";
import { Dots } from "./Dots";
import classes from "./LandingHero.module.css";

export function LandingHero() {
  return (
    <Container className={classes.wrapper}>
      <Dots className={classes.dots} style={{ left: 30, top: 30 }} />
      <Dots className={classes.dots} style={{ left: 90, top: 30 }} />
      <Dots className={classes.dots} style={{ left: 30, top: 170 }} />
      <Dots className={classes.dots} style={{ right: 30, top: 90 }} />

      <Container size={700} className={classes.inner}>
        <h1 className={classes.title}>
          Get the party started with{" "}
          <Text
            component="span"
            gradient={{ from: "red", to: "yellow" }}
            variant="gradient"
            inherit
          >
            GiveawayBot
          </Text>
        </h1>

        <Text className={classes.description}>
          Tired of managing giveaways manually? Join millions of Discord
          communities and automate your giveaways with GiveawayBot!
        </Text>

        <Group className={classes.controls}>
          <Button
            size="xl"
            className={classes.control}
            variant="gradient"
            gradient={{ from: "blue", to: "cyan" }}
          >
            Get started
          </Button>
        </Group>
      </Container>
    </Container>
  );
}
