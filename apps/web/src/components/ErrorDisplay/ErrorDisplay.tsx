import {
  Alert,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconCrown, IconInfoCircle, IconRefresh } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { TRPCClientError } from "@trpc/client";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export type NotFoundConfig = {
  titleKey: string;
  messageKey: string;
};

export type ErrorDisplayProps = {
  error: unknown;
  onRetry?: () => void;
  notFoundConfig?: NotFoundConfig;
};

export const ErrorDisplay = memo(function ErrorDisplay({
  error,
  onRetry,
  notFoundConfig,
}: ErrorDisplayProps) {
  const { t } = useTranslation();

  let title = t("errors.generic.title");
  let message = t("errors.unexpected");
  let color = "red";
  let isTransient = true;

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
      isTransient = false;
    } else if (error.data?.code === "FORBIDDEN") {
      title = t("errors.accessDenied.title");
      message = t("errors.accessDenied.message");
      color = "orange";
      isTransient = false;
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
      isTransient = false;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <Container size="lg" py="xl">
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
          {isTransient && onRetry && (
            <Group gap="sm" mt="xs">
              <Button
                onClick={onRetry}
                leftSection={<IconRefresh size={16} aria-hidden="true" />}
                variant="light"
                size="sm"
              >
                {t("common.tryAgain")}
              </Button>
            </Group>
          )}
        </Stack>
      </Alert>
    </Container>
  );
});
