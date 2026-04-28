import { Burger, Button, Container, Flex, Text } from "@mantine/core";
import { IconConfetti } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useDrawer } from "../contexts/DrawerContext";
import classes from "./Header.module.css";

export function Header() {
  const { t } = useTranslation();
  const { isDrawerOpen, toggleDrawer } = useDrawer();

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <Flex gap="xs">
          <Link to="/">
            <Button
              variant="subtle"
              size="xs"
              color="indigo"
              leftSection={
                <IconConfetti
                  className={classes.title}
                  size={30}
                  aria-hidden="true"
                />
              }
            >
              <Text component="span" className={classes.title}>
                GiveawayBot
              </Text>
            </Button>
          </Link>
        </Flex>

        <Burger
          opened={isDrawerOpen}
          onClick={toggleDrawer}
          hiddenFrom="sm"
          size="sm"
          aria-label={t("nav.toggleMenu")}
        />
      </Container>
    </header>
  );
}
