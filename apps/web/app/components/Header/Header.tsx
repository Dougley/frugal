import { Burger, Button, Container, Flex } from "@mantine/core";
import { IconConfetti } from "@tabler/icons-react";
import { Link } from "react-router";
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
          <Link to="/">
            <Button
              variant="subtle"
              size="xs"
              color="gray"
              leftSection={<IconConfetti className={classes.title} size={30} />}
            >
              <span className={classes.title}>GiveawayBot</span>
            </Button>
          </Link>
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
