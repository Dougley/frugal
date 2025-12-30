import {
  Alert,
  Avatar,
  Button,
  Card,
  Code,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { useAuth } from "~/components/AuthContext";
import { signIn, signOut } from "~/server/auth/client";

export function AuthCard() {
  const [isLoading, setIsLoading] = useState(false);

  // Get session from AuthContext
  const { user, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "discord",
        callbackURL: "/",
      });
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      // Reload to clear SSR session data
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <Card withBorder p="lg">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={3}>Authentication</Title>
        </Group>

        {isAuthenticated && user ? (
          <>
            <Group>
              <Avatar
                src={user.avatarUrl}
                alt={user.globalName ?? user.username}
                radius="xl"
                size="lg"
              />
              <Stack gap={2}>
                <Text fw={500}>{user.globalName ?? user.username}</Text>
                <Text size="sm" c="dimmed">
                  {user.email}
                </Text>
              </Stack>
            </Group>
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Discord ID:
              </Text>
              <Code>{user.id}</Code>
            </Group>
            <Button
              variant="light"
              color="red"
              onClick={handleLogout}
              loading={isLoading}
            >
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Text c="dimmed">
              Sign in with Discord to access protected features.
            </Text>
            <Button
              variant="filled"
              color="indigo"
              onClick={handleLogin}
              loading={isLoading}
            >
              Sign in with Discord
            </Button>
          </>
        )}

        <Alert color="cyan" variant="light">
          Uses Better Auth with stateless sessions (encrypted cookie, no
          database). Auth data fetched during SSR.
        </Alert>
      </Stack>
    </Card>
  );
}
