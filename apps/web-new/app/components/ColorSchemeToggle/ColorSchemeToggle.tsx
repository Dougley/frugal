"use client";

import { NavLink, useMantineColorScheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import classes from "./ColorSchemeToggle.module.css";

export function ColorSchemeToggle() {
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null on first render to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  const theme =
    colorScheme === "auto" ? (prefersDark ? "dark" : "light") : colorScheme;

  return (
    <NavLink
      className={classes.link}
      href="#"
      label={`Use ${theme === "light" ? "Dark" : "Light"} mode`}
      onClick={() => {
        setColorScheme(theme === "light" ? "dark" : "light");
      }}
      leftSection={
        theme === "light" ? (
          <IconMoon className={classes.linkIcon} />
        ) : (
          <IconSun className={classes.linkIcon} />
        )
      }
    />
  );
}
