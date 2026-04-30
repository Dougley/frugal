import { Button, Card, Container, Flex, Group, Text } from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconRefresh,
} from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { signIn } from "~/server/auth/client";
import { noIndexMeta } from "~/utils/seo";

const searchSchema = z.object({
  message: z.string().optional(),
  returnTo: z.string().optional(),
});

export const Route = createFileRoute("/auth/error")({
  validateSearch: searchSchema,
  component: AuthErrorPage,
  head: () => ({
    meta: [{ title: "Authentication Error | GiveawayBot" }, ...noIndexMeta],
  }),
});

function AuthErrorPage() {
  const { message, returnTo } = Route.useSearch();

  const handleRetry = () => {
    signIn.social({
      provider: "discord",
      callbackURL: returnTo ?? "/",
    });
  };

  return (
    <Container>
      <Flex justify="center" align="center" h="100vh">
        <Card withBorder shadow="md" p="xl" radius="md">
          <Flex direction="column" align="center" gap="md">
            <IconAlertTriangle
              size={48}
              color="var(--mantine-color-yellow-6)"
              aria-hidden="true"
            />
            <Text fw={700} fz="h2" ta="center">
              Authentication Failed
            </Text>
            <Text c="dimmed" ta="center" maw={400}>
              {message ?? "An unknown error occurred during authentication."}
            </Text>
            <Group gap="sm" justify="center" mt="md">
              <Button
                component={Link}
                to={returnTo ?? "/"}
                variant="default"
                leftSection={<IconArrowLeft size={16} aria-hidden="true" />}
              >
                Go back
              </Button>
              <Button
                variant="filled"
                leftSection={<IconRefresh size={16} aria-hidden="true" />}
                onClick={handleRetry}
              >
                Try again
              </Button>
            </Group>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}
