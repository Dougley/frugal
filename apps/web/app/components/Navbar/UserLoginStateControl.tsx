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
import { Form } from "react-router";
import { DiscordUser } from "~/types/DiscordUser";
import classes from "./Navbar.module.css";

export const UserLoginStateControl = ({
  user,
}: {
  user: DiscordUser | null;
}) => {
  if (!user) {
    return (
      <Form action="/api/auth/login/discord" method="post">
        <UnstyledButton type="submit" className={classes.link}>
          <IconLogin className={classes.linkIcon} stroke={1.5} />
          <span>Login</span>
        </UnstyledButton>
      </Form>
    );
  }

  return (
    <div>
      <Popover position="bottom" withArrow shadow="xl" width="target">
        <Popover.Target>
          <Group
            className={classes.link}
            style={{ cursor: "pointer" }}
            aria-label="User menu"
          >
            <Avatar src={user.avatar} alt={user.username} radius="xl" />
            <div style={{ flex: 1, maxWidth: "calc(100% - 125px)" }}>
              <Text size="sm" fw={500} truncate>
                {user.displayName}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {user.username}
              </Text>
            </div>
            <IconMenu2 className={classes.linkIcon} stroke={1.5} />
          </Group>
        </Popover.Target>
        <Popover.Dropdown bg="var(--mantine-color-body)">
          <Stack align="stretch" justify="center" gap="md">
            <Form action="/api/auth/logout" method="post">
              <Button
                type="submit"
                variant="outline"
                color="red"
                fullWidth
                autoContrast
              >
                <IconLogout className={classes.logoutButton} stroke={1.5} />
                <span>Logout</span>
              </Button>
            </Form>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </div>
  );
};
