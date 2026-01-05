import {
  Alert,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCrown,
  IconInfoCircle,
  IconRefresh,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { TRPCClientError } from "@trpc/client";
import { memo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Error display configuration for NOT_FOUND errors
 * Allows customizing the title and message for context-specific errors
 */
export type NotFoundConfig = {
  /** Translation key for the title (e.g., "errors.guildNotFound.title") */
  titleKey: string;
  /** Translation key for the message (e.g., "errors.guildNotFound.message") */
  messageKey: string;
};

export type ErrorDisplayProps = {
  /** The error to display */
  error: unknown;
  /** Callback when user clicks retry */
  onRetry: () => void;
  /** Back link destination (defaults to "/giveaways/overview") */
  backTo?: string;
  /** Back link label translation key (defaults to "giveaways.backToGiveaways") */
  backLabelKey?: string;
  /** Custom NOT_FOUND error configuration */
  notFoundConfig?: NotFoundConfig;
};

/**
 * Generic error display component for TRPC errors
 *
 * Handles common error types:
 * - FORBIDDEN: Access denied (orange)
 * - NOT_FOUND: Resource not found (yellow) - customizable via notFoundConfig
 * - Generic errors: Unexpected error (red)
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ErrorDisplay error={error} onRetry={refetch} />
 *
 * // With custom NOT_FOUND config
 * <ErrorDisplay
 *   error={error}
 *   onRetry={refetch}
 *   notFoundConfig={{
 *     titleKey: "errors.guildNotFound.title",
 *     messageKey: "errors.guildNotFound.message",
 *   }}
 * />
 * ```
 */
export const ErrorDisplay = memo(function ErrorDisplay({
  error,
  onRetry,
  backTo = "/giveaways/overview",
  backLabelKey = "giveaways.backToGiveaways",
  notFoundConfig,
}: ErrorDisplayProps) {
  const { t } = useTranslation();

  let title = t("errors.generic.title");
  let message = t("errors.unexpected");
  let color = "red";

  const isPremiumRequired =
    error instanceof TRPCClientError &&
    error.data?.code === "FORBIDDEN" &&
    error.message.startsWith("402");

  if (error instanceof TRPCClientError) {
    message = error.message;
    if (isPremiumRequired) {
      title = t("errors.premiumRequired.title");
      message = t("errors.premiumRequired.message");
      color = "yellow";
    } else if (error.data?.code === "FORBIDDEN") {
      title = t("errors.accessDenied.title");
      message = t("errors.accessDenied.message");
      color = "orange";
    } else if (error.data?.code === "NOT_FOUND") {
      if (notFoundConfig) {
        // Cast to satisfy i18n type checking - keys are validated at call site
        title = t(notFoundConfig.titleKey as "errors.generic.title");
        message = t(notFoundConfig.messageKey as "errors.unexpected");
      } else {
        title = t("errors.generic.title");
        message = t("errors.unexpected");
      }
      color = "yellow";
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Button
          component={Link}
          to={backTo}
          variant="subtle"
          leftSection={<IconArrowLeft size={16} aria-hidden="true" />}
          w="fit-content"
        >
          {t(backLabelKey as "giveaways.backToGiveaways")}
        </Button>

        <Alert
          icon={
            isPremiumRequired ? (
              <IconCrown aria-hidden="true" />
            ) : (
              <IconInfoCircle aria-hidden="true" />
            )
          }
          color={color}
          variant="light"
          role="alert"
        >
          <Stack gap="xs">
            <Title order={3}>{title}</Title>
            <Text size="sm">{message}</Text>
            {isPremiumRequired && (
              <Group gap="sm" mt="xs">
                <Button
                  component={Link}
                  to="/premium"
                  leftSection={<IconCrown size={16} aria-hidden="true" />}
                >
                  {t("errors.premiumRequired.action")}
                </Button>
              </Group>
            )}
          </Stack>
        </Alert>

        <Button
          onClick={onRetry}
          leftSection={<IconRefresh size={16} aria-hidden="true" />}
          variant="light"
          w="fit-content"
        >
          {t("common.tryAgain")}
        </Button>
      </Stack>
    </Container>
  );
});
