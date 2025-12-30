import {
  Avatar,
  Button,
  Group,
  Popover,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconLogin, IconLogout, IconMenu2 } from "@tabler/icons-react";
import { useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useOptionalAuth } from "~/components/AuthContext";
import { signIn, signOut } from "~/server/auth/client";
import classes from "./Navbar.module.css";

export const UserLoginStateControl = () => {
  const { t } = useTranslation();
  const user = useOptionalAuth();
  const location = useLocation();
  const returnTo = location.href;

  const handleLogin = async () => {
    await signIn.social({
      provider: "discord",
      callbackURL: returnTo || "/",
    });
  };

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = returnTo || "/";
        },
      },
    });
  };

  if (!user) {
    return (
      <UnstyledButton className={classes.link} onClick={handleLogin}>
        <IconLogin
          className={classes.linkIcon}
          stroke={1.5}
          aria-hidden="true"
        />
        <span>{t("auth.login")}</span>
      </UnstyledButton>
    );
  }

  return (
    <div>
      <Popover position="bottom" withArrow shadow="xl" width="target">
        <Popover.Target>
          <Group
            className={classes.link}
            style={{ cursor: "pointer" }}
            aria-label={t("auth.userMenu")}
          >
            <Avatar src={user.avatarUrl} alt={user.username} radius="xl" />
            <div style={{ flex: 1, maxWidth: "calc(100% - 125px)" }}>
              <Group gap={4}>
                <Text size="sm" fw={500} truncate>
                  {user.globalName}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" truncate>
                {user.username}
              </Text>
            </div>
            <IconMenu2
              className={classes.linkIcon}
              stroke={1.5}
              aria-hidden="true"
            />
          </Group>
        </Popover.Target>
        <Popover.Dropdown bg="var(--mantine-color-body)">
          <Stack align="stretch" justify="center" gap="md">
            <Button
              variant="outline"
              color="red"
              fullWidth
              autoContrast
              onClick={handleLogout}
            >
              <IconLogout
                className={classes.logoutButton}
                stroke={1.5}
                aria-hidden="true"
              />
              <span>{t("auth.logout")}</span>
            </Button>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </div>
  );
};
