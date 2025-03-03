import { Burger, Container, Flex } from "@mantine/core";
import { IconConfetti } from "@tabler/icons-react";
import { useDrawer } from "../contexts/DrawerContext";
import classes from "./Header.module.css";

const links = [
  { link: "/about", label: "Features" },
  { link: "/pricing", label: "Pricing" },
  { link: "/learn", label: "Learn" },
  { link: "/community", label: "Community" },
];

export function Header() {
  const { isDrawerOpen, toggleDrawer } = useDrawer();

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <Flex gap="xs">
          <IconConfetti size={30} />
          <span className={classes.title}>GiveawayBot</span>
        </Flex>

        <Burger
          opened={isDrawerOpen}
          onClick={toggleDrawer}
          hiddenFrom="sm"
          size="sm"
        />
      </Container>
    </header>
  );
}
