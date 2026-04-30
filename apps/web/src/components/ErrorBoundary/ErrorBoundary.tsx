import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Group,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCrown,
  IconExclamationMark,
  IconFileUnknown,
  IconLockX,
  IconMoodSad,
  IconRefresh,
} from "@tabler/icons-react";
import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ErrorDetails {
  icon: React.ReactNode;
  titleKey: string;
  messageKey: string;
  showRetry?: boolean;
  retryLabelKey?: string;
  /** Optional link for action button (e.g., upgrade to premium) */
  actionLink?: string;
  actionLabelKey?: string;
  /** Optional rich message content */
  message?: React.ReactNode;
}

const HTTP_ERROR_DETAILS: Record<number, ErrorDetails> = {
  401: {
    icon: <IconLockX size={48} aria-hidden="true" />,
    titleKey: "errors.401.title",
    messageKey: "errors.401.message",
    showRetry: true,
    retryLabelKey: "auth.login",
  },
  402: {
    icon: (
      <IconCrown
        size={48}
        color="var(--mantine-color-yellow-6)"
        aria-hidden="true"
      />
    ),
    titleKey: "errors.premiumRequired.title",
    messageKey: "errors.premiumRequired.message",
    actionLink: "/premium",
    actionLabelKey: "errors.premiumRequired.action",
  },
  403: {
    icon: <IconAlertTriangle size={48} aria-hidden="true" />,
    titleKey: "errors.403.title",
    messageKey: "errors.403.message",
  },
  404: {
    icon: <IconFileUnknown size={48} aria-hidden="true" />,
    titleKey: "errors.404.title",
    messageKey: "errors.404.message",
  },
  500: {
    icon: <IconMoodSad size={64} color="#fa5252" aria-hidden="true" />,
    titleKey: "errors.500.title",
    messageKey: "errors.500.message",
  },
};

function getErrorDetails(error: Error): ErrorDetails {
  // Check if it's an HTTP-like error with status code
  const statusMatch = error.message.match(/^(\d{3})/);
  if (statusMatch) {
    const status = Number.parseInt(statusMatch[1], 10);
    const details = HTTP_ERROR_DETAILS[status];
    if (details) {
      return details;
    }
    return {
      icon: <IconExclamationMark size={48} aria-hidden="true" />,
      titleKey: `${status} Error`,
      messageKey: error.message,
    };
  }

  // Generic error
  return {
    icon: <IconMoodSad size={64} color="#fa5252" aria-hidden="true" />,
    titleKey: "errors.generic.title",
    messageKey: "errors.generic.message",
  };
}

export interface RootErrorComponentProps {
  error: Error;
  reset?: () => void;
}

export function RootErrorComponent({ error, reset }: RootErrorComponentProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [eventId, setEventId] = useState<string | null>(null);
  const details = getErrorDetails(error);
  const isServerError = !error.message.match(/^(4\d{2})/); // Not a 4xx error

  // Helper to get translated text or fallback to raw key (for dynamic error messages)
  const getText = (key: string) => {
    const translated = t(key, { defaultValue: key });
    return translated;
  };

  useEffect(() => {
    // Only capture unexpected errors to Sentry (not 4xx client errors)
    // Dynamically import Sentry to avoid SSR issues
    if (isServerError && !eventId && typeof window !== "undefined") {
      import("@sentry/tanstackstart-react").then((Sentry) => {
        const id = Sentry.captureException(error);
        setEventId(id);
      });
    }
  }, [error, eventId, isServerError]);

  const handleGoBack = () => {
    router.history.back();
  };

  const handleRetry = () => {
    if (reset) {
      reset();
    } else {
      router.invalidate();
    }
  };

  if (isServerError) {
    return (
      <Box component="main">
        <Flex justify="center" align="center" h="100vh">
          <Card
            withBorder
            shadow="0 0 0 2px #fa5252, 0 8px 32px rgba(250,82,82,0.08)"
            p="md"
            role="alert"
            aria-live="assertive"
          >
            <Flex direction="column" align="center" gap="sm">
              {details.icon}
              <Title order={1} size="h2" ta="center" c="red.7">
                {getText(details.titleKey)}
              </Title>
              <Text ta="center">{getText(details.messageKey)}</Text>
              {eventId && (
                <Text ta="center" c="dimmed" size="xs">
                  {getText("errors.reference")} <code>{eventId}</code>
                </Text>
              )}
              <Group gap="sm" justify="center">
                <Button
                  leftSection={<IconArrowLeft aria-hidden="true" />}
                  variant="default"
                  onClick={handleGoBack}
                >
                  {getText("common.goBack")}
                </Button>
                <Button
                  leftSection={<IconRefresh aria-hidden="true" />}
                  onClick={handleRetry}
                >
                  {getText("common.tryAgain")}
                </Button>
              </Group>
            </Flex>
          </Card>
        </Flex>
      </Box>
    );
  }

  return (
    <Container component="main">
      <Flex justify="center" align="center" h="100vh">
        <Card withBorder shadow="md" p="md">
          <Flex direction="column" align="center" gap="sm">
            {details.icon}
            <Title order={1} size="h2" ta="center">
              {getText(details.titleKey)}
            </Title>
            <Text ta="center">
              {details.message ?? getText(details.messageKey)}
            </Text>
            <Group gap="sm" justify="center">
              <Button
                leftSection={<IconArrowLeft aria-hidden="true" />}
                variant="default"
                onClick={handleGoBack}
              >
                {getText("common.goBack")}
              </Button>
              {details.actionLink && (
                <Button
                  component={Link}
                  to={details.actionLink}
                  leftSection={<IconCrown size={16} aria-hidden="true" />}
                >
                  {details.actionLabelKey
                    ? getText(details.actionLabelKey)
                    : getText("common.view")}
                </Button>
              )}
              {details.showRetry && (
                <Button
                  leftSection={<IconRefresh aria-hidden="true" />}
                  onClick={handleRetry}
                >
                  {details.retryLabelKey
                    ? getText(details.retryLabelKey)
                    : getText("common.retry")}
                </Button>
              )}
            </Group>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}
