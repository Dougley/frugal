import { Burger, Flex, Group, NavLink, ScrollArea } from "@mantine/core";
import {
  IconConfetti,
  IconDiamond,
  IconFileDollar,
  IconFileTextShield,
  IconGavel,
  IconHome,
  IconSectionSign,
} from "@tabler/icons-react";
import { NavLink as RemixNavLink, useRouteLoaderData } from "react-router";
import { useDrawer } from "../contexts/DrawerContext";
import classes from "./Navbar.module.css";
import { Settings } from "./Settings";
import { UserLoginStateControl } from "./UserLoginStateControl";

interface NavItem {
  label: string;
  link: string;
  icon: React.ComponentType<{ className?: string; stroke?: number }>;
  children?: NavItem[];
}

const data: NavItem[] = [
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
    label: "Legal",
    link: "/legal",
    icon: IconGavel,
    children: [
      {
        label: "Terms of Service",
        link: "/legal/terms",
        icon: IconSectionSign,
      },
      {
        label: "Privacy Policy",
        link: "/legal/privacy",
        icon: IconFileTextShield,
      },
      {
        label: "Paid Services Agreement",
        link: "/legal/paid-services",
        icon: IconFileDollar,
      },
    ],
  },
];

const renderNavLinks = (
  items: NavItem[],
  closeDrawer: () => void,
): React.ReactNode => {
  return items.map((item) => (
    <NavLink
      className={classes.link}
      href={item.link}
      key={item.label}
      label={item.label}
      leftSection={<item.icon className={classes.linkIcon} stroke={1.5} />}
      renderRoot={(props) => <RemixNavLink to={item.link} {...props} />}
      onClick={() => {
        if (!item.children) {
          closeDrawer();
        }
      }}
    >
      {item.children && renderNavLinks(item.children, closeDrawer)}
    </NavLink>
  ));
};

export function Navbar() {
  const { isDrawerOpen, toggleDrawer, closeDrawer, openDrawer } = useDrawer();
  const rootData = useRouteLoaderData("root");

  const links = renderNavLinks(data, closeDrawer);

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
          <div className={classes.linksInner}>
            {links}
            <Settings />
          </div>
        </ScrollArea>
      </div>
      <div className={classes.footer}>
        <UserLoginStateControl user={rootData?.user} />
      </div>
    </>
  );
}
