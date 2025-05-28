import { Button, Card, Container, Flex, Group, Text } from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconRefresh,
} from "@tabler/icons-react";
import { Form, redirect, useLoaderData } from "react-router";
import { getAndClearReturnUrl } from "~/utils/auth";
import type { Route } from "./+types/auth.error";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const message = url.searchParams.get("message");
  return {
    message,
  };
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const returnUrl = await getAndClearReturnUrl(request, context);
  return redirect(returnUrl ?? "/");
};

export default function AuthErrorPage() {
  const { message } = useLoaderData<typeof loader>();
  return (
    <Container>
      <Flex justify="center" align="center" h="100vh">
        <Card withBorder shadow="md" p="md">
          <Flex direction="column" align="center" gap="sm">
            <IconAlertTriangle size={48} />
            <Text fw={900} fz="h2" ta="center">
              Authentication failed
            </Text>
            <Text>{message ?? "Unknown error"}</Text>
            <Group gap="sm" justify="center">
              <Form method="post" action="/auth/error">
                <Button
                  variant="default"
                  type="submit"
                  leftSection={<IconArrowLeft />}
                >
                  Go back
                </Button>
              </Form>
              <Form method="post" action="/api/auth/login/discord">
                <Button
                  variant="default"
                  type="submit"
                  leftSection={<IconRefresh />}
                >
                  Retry
                </Button>
              </Form>
            </Group>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}
