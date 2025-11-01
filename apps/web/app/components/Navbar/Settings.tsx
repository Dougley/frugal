import { NavLink } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconSettings, IconSpy } from "@tabler/icons-react";
import { ColorSchemeToggle } from "../ColorSchemeToggle/ColorSchemeToggle";
import { PrivacySettings } from "../PrivacySettings/PrivacySettings";
import classes from "./Navbar.module.css";

export const Settings = () => {
  return (
    <NavLink
      className={classes.link}
      href="#"
      label="Settings"
      leftSection={<IconSettings className={classes.linkIcon} stroke={1.5} />}
    >
      <ColorSchemeToggle />
      <NavLink
        className={classes.link}
        href="#"
        label="Privacy"
        leftSection={<IconSpy className={classes.linkIcon} stroke={1.5} />}
        onClick={() => {
          modals.open({
            title: "Privacy Settings",
            children: <PrivacySettings />,
            size: "md",
          });
        }}
      />
    </NavLink>
  );
};
