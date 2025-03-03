import { NavLink } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSettings, IconSpy } from "@tabler/icons-react";
import { ColorSchemeToggle } from "../ColorSchemeToggle/ColorSchemeToggle";
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
          notifications.show({
            title: "Coming soon",
            message: "Privacy settings are not available yet",
          });
        }}
      />
    </NavLink>
  );
};
