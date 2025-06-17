import {
  Anchor,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Group,
  Text,
} from "@mantine/core";
import * as Sentry from "@sentry/react";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCoins,
  IconExclamationMark,
  IconFileUnknown,
  IconLockX,
  IconMoodSad,
  IconRefresh,
} from "@tabler/icons-react";
import React from "react";
import {
  isRouteErrorResponse,
  Link,
  useNavigate,
  useRouteError,
} from "react-router";

const INTENTIONAL_ERRORS: Record<
  number,
  {
    icon: React.ReactNode;
    title: string;
    message: React.ReactNode;
    showRetry?: boolean;
    retryLabel?: string;
    retryAction?: string;
  }
> = {
  401: {
    icon: <IconLockX size={48} />, // Unauthorized
    title: "401 Unauthorized",
    message: "You're not authorized to view this page, are you logged in?",
    showRetry: true,
    retryLabel: "Login",
    retryAction: "/api/auth/login/discord",
  },
  403: {
    icon: <IconAlertTriangle size={48} />, // Forbidden
    title: "403 Forbidden",
    message: "The Maze Master doesn't want you here. Seek another path.",
  },
  404: {
    icon: <IconFileUnknown size={48} />, // Not Found
    title: "404 Not Found",
    message: "This page doesn't exist. Did you get lost?",
  },
  402: {
    icon: <IconCoins size={48} />, // Payment Required
    title: "402 Payment Required",
    message: (
      <Flex direction="column" align="center" justify="center">
        <Text>This page needs a premium subscription.</Text>
        <Anchor
          href="/premium"
          renderRoot={(props) => <Link to="/premium" {...props} />}
        >
          Get one now!
        </Anchor>
        <Text size="xs" c="dimmed">
          Already have one? Make sure you&apos;re logged in.
        </Text>
      </Flex>
    ),
  },
};

function getIntentionalErrorDetails(status: number, statusText: string) {
  const details = INTENTIONAL_ERRORS[status];
  if (details) {
    return {
      icon: details.icon,
      title: details.title,
      message: details.message,
      showRetry: details.showRetry || false,
      retryLabel: details.retryLabel || "Retry",
      retryAction: details.retryAction || "/api/auth/login/discord",
    };
  }
  return {
    icon: <IconExclamationMark size={48} />,
    title: `${status} ${statusText}`,
    message: "Something went wrong.",
    showRetry: false,
    retryLabel: "Retry",
    retryAction: "/api/auth/login/discord",
  };
}

export function TopErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [eventId, setEventId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (error instanceof Error && !eventId) {
      const id = Sentry.captureException(error);
      setEventId(id);
    }
  }, [error, eventId]);

  if (isRouteErrorResponse(error)) {
    const { icon, title, message, showRetry, retryLabel, retryAction } =
      getIntentionalErrorDetails(error.status, error.statusText);
    return (
      <Container>
        <Flex justify="center" align="center" h="100vh">
          <Card withBorder shadow="md" p="md">
            <Flex direction="column" align="center" gap="sm">
              {icon}
              <Text fw={900} fz="h2" ta="center">
                {title}
              </Text>
              <Text>{message}</Text>
              <Group gap="sm" justify="center">
                <Button
                  leftSection={<IconArrowLeft />}
                  variant="default"
                  onClick={() => navigate(-1)}
                >
                  Go back
                </Button>
                {showRetry && (
                  <form
                    method="post"
                    action={retryAction}
                    style={{ display: "inline" }}
                  >
                    <Button type="submit" leftSection={<IconRefresh />}>
                      {retryLabel}
                    </Button>
                  </form>
                )}
              </Group>
            </Flex>
          </Card>
        </Flex>
      </Container>
    );
  } else if (error instanceof Error) {
    return (
      <Box>
        <Flex justify="center" align="center" h="100vh">
          <Card
            withBorder
            shadow="0 0 0 2px #fa5252, 0 8px 32px rgba(250,82,82,0.08)"
            p="md"
          >
            <Flex direction="column" align="center" gap="sm">
              <IconMoodSad size={64} color="#fa5252" />
              <Text fw={900} fz="h2" ta="center" c="red.7">
                500 Internal Server Error
              </Text>
              <Text ta="center">
                This error is on our end, our bad. Please try again later.
              </Text>
              {eventId && (
                <Text ta="center" c="dimmed" size="xs">
                  Error reference: <code>{eventId}</code>
                </Text>
              )}
              <Group gap="sm" justify="center">
                <Button
                  leftSection={<IconArrowLeft />}
                  variant="default"
                  onClick={() => navigate(-1)}
                >
                  Go back
                </Button>
              </Group>
            </Flex>
          </Card>
        </Flex>
      </Box>
    );
  }
}
