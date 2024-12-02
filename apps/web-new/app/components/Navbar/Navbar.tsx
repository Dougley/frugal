import { Burger, Flex, Group, NavLink, ScrollArea } from "@mantine/core";
import { NavLink as RemixNavLink } from "react-router";
import {
  IconConfetti,
  IconDiamond,
  IconHome,
  IconLogout,
  IconSettings,
  IconSwitchHorizontal,
} from "@tabler/icons-react";
import { useDrawer } from "../contexts/DrawerContext";
import classes from "./Navbar.module.css";

const data = [
  { label: "Home", link: "/", icon: IconHome },
  { label: "Premium", link: "/premium", icon: IconDiamond },
  {
    label: "Giveaways",
    link: "/giveaways",
    icon: IconConfetti,
    children: [
      { label: "Create", link: "/giveaways/create", icon: IconConfetti },
      { label: "List", link: "/giveaways/list", icon: IconConfetti },
    ],
  },
  {
    label: "Settings",
    link: "/settings",
    icon: IconSettings,
    children: [
      {
        label: "General",
        link: "/settings/general",
        icon: IconSwitchHorizontal,
      },
      {
        label: "Appearance",
        link: "/settings/appearance",
        icon: IconSwitchHorizontal,
      },
      {
        label: "Security",
        link: "/settings/security",
        icon: IconSwitchHorizontal,
      },
    ],
  },
];

export function Navbar() {
  const { isDrawerOpen, toggleDrawer } = useDrawer();
  // const loaderData = useFetch("/api/resources/me");

  const links = data.map((item) => (
    <NavLink
      className={classes.link}
      href={item.link}
      key={item.label}
      label={item.label}
      leftSection={<item.icon className={classes.linkIcon} stroke={1.5} />}
      renderRoot={(props) => <RemixNavLink to={item.link} {...props} />}
    >
      {item.children &&
        item.children.map((child) => (
          <NavLink
            className={classes.link}
            href={child.link}
            key={child.label}
            label={child.label}
            leftSection={
              <child.icon className={classes.linkIcon} stroke={1.5} />
            }
            renderRoot={(props) => <RemixNavLink to={child.link} {...props} />}
          />
        ))}
    </NavLink>
  ));

  return (
    <>
      <div className={classes.navbar}>
        <Group className={classes.header} justify="space-between">
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
        </Group>
        <ScrollArea className={classes.scrollArea}>
          <div>{links}</div>
        </ScrollArea>
      </div>

      <div className={classes.footer}>
        {/* <ColorSchemeToggle /> */}
        <a
          href="#"
          className={classes.link}
          onClick={(event) => event.preventDefault()}
        >
          <IconSwitchHorizontal className={classes.linkIcon} stroke={1.5} />
          <span>Change account</span>
        </a>

        <a
          href="#"
          className={classes.link}
          onClick={(event) => event.preventDefault()}
        >
          <IconLogout className={classes.linkIcon} stroke={1.5} />
          <span>Logout</span>
        </a>
      </div>
    </>
  );
}
