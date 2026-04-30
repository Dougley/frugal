import {
  Burger,
  Button,
  Flex,
  Group,
  NavLink,
  ScrollArea,
  Text,
} from "@mantine/core";
import {
  IconBook,
  IconChartBar,
  IconCode,
  IconConfetti,
  IconDiamond,
  IconFileDollar,
  IconFileTextShield,
  IconGavel,
  IconHome,
  IconList,
  IconRocket,
  IconSectionSign,
  IconTerminal,
  IconUsers,
  IconZoomIn,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useDrawer } from "../contexts/DrawerContext";
import classes from "./Navbar.module.css";
import { Settings } from "./Settings";
import { UserLoginStateControl } from "./UserLoginStateControl";

// Navigation label keys - must match keys in locales/*/nav.*
type NavLabelKey =
  | "nav.home"
  | "nav.premium"
  | "nav.giveaways"
  | "nav.list"
  | "nav.summaries"
  | "nav.wiki"
  | "nav.gettingStarted"
  | "nav.userGuides"
  | "nav.developerDocs"
  | "nav.advancedTopics"
  | "nav.reference"
  | "nav.legal"
  | "nav.termsOfService"
  | "nav.privacyPolicy"
  | "nav.paidServicesAgreement";

interface NavItem {
  labelKey: NavLabelKey;
  link: string;
  icon: React.ComponentType<{ className?: string; stroke?: number }>;
  children?: NavItem[];
}

const data: NavItem[] = [
  { labelKey: "nav.home", link: "/", icon: IconHome },
  { labelKey: "nav.premium", link: "/premium", icon: IconDiamond },
  {
    labelKey: "nav.giveaways",
    link: "/guilds",
    icon: IconConfetti,
    children: [
      { labelKey: "nav.list", link: "/guilds", icon: IconList },
      {
        labelKey: "nav.summaries",
        link: "/summaries",
        icon: IconZoomIn,
      },
    ],
  },
  {
    labelKey: "nav.wiki",
    link: "/wiki",
    icon: IconBook,
    children: [
      {
        labelKey: "nav.gettingStarted",
        link: "/wiki/getting-started",
        icon: IconRocket,
      },
      {
        labelKey: "nav.userGuides",
        link: "/wiki/user-guides",
        icon: IconUsers,
      },
      {
        labelKey: "nav.developerDocs",
        link: "/wiki/developer",
        icon: IconCode,
      },
      {
        labelKey: "nav.advancedTopics",
        link: "/wiki/advanced",
        icon: IconChartBar,
      },
      {
        labelKey: "nav.reference",
        link: "/wiki/reference",
        icon: IconTerminal,
      },
    ],
  },
  {
    labelKey: "nav.legal",
    link: "/legal",
    icon: IconGavel,
    children: [
      {
        labelKey: "nav.termsOfService",
        link: "/legal/terms",
        icon: IconSectionSign,
      },
      {
        labelKey: "nav.privacyPolicy",
        link: "/legal/privacy",
        icon: IconFileTextShield,
      },
      {
        labelKey: "nav.paidServicesAgreement",
        link: "/legal/paid-services",
        icon: IconFileDollar,
      },
    ],
  },
];

function NavLinks({
  items,
  closeDrawer,
}: {
  items: NavItem[];
  closeDrawer: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      {items.map((item) => (
        <NavLink
          className={classes.link}
          href={item.link}
          key={item.labelKey}
          label={t(item.labelKey)}
          leftSection={
            <item.icon
              className={classes.linkIcon}
              stroke={1.5}
              aria-hidden="true"
            />
          }
          component={Link}
          to={item.link}
          onClick={() => {
            if (!item.children) {
              closeDrawer();
            }
          }}
        >
          {item.children && (
            <NavLinks items={item.children} closeDrawer={closeDrawer} />
          )}
        </NavLink>
      ))}
    </>
  );
}

export function Navbar() {
  const { t } = useTranslation();
  const { isDrawerOpen, toggleDrawer, closeDrawer } = useDrawer();

  return (
    <>
      <div className={classes.navbar}>
        <Group className={classes.header} justify="space-between">
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
                  {t("common.brand")}
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
        </Group>
        <ScrollArea className={classes.scrollArea}>
          <div className={classes.linksInner}>
            <NavLinks items={data} closeDrawer={closeDrawer} />
            <Settings />
          </div>
        </ScrollArea>
      </div>
      <div className={classes.footer}>
        <UserLoginStateControl />
      </div>
    </>
  );
}
