import { NavLink } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconSettings, IconSpy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { ColorSchemeToggle } from "../ColorSchemeToggle/ColorSchemeToggle";
import { PrivacySettings } from "../PrivacySettings/PrivacySettings";
import { LanguageSwitcher } from "./LanguageSwitcher";
import classes from "./Navbar.module.css";

export const Settings = () => {
  const { t } = useTranslation();

  return (
    <NavLink
      className={classes.link}
      href="#"
      label={t("settings.label")}
      leftSection={
        <IconSettings
          className={classes.linkIcon}
          stroke={1.5}
          aria-hidden="true"
        />
      }
    >
      <ColorSchemeToggle />
      <LanguageSwitcher />
      <NavLink
        className={classes.link}
        href="#"
        label={t("settings.privacy")}
        leftSection={
          <IconSpy
            className={classes.linkIcon}
            stroke={1.5}
            aria-hidden="true"
          />
        }
        onClick={() => {
          modals.open({
            title: t("privacy.title"),
            children: <PrivacySettings />,
            size: "md",
          });
        }}
      />
    </NavLink>
  );
};
