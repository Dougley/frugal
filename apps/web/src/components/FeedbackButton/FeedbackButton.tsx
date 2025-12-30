import {
  Box,
  Button,
  type ButtonProps,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import * as Sentry from "@sentry/tanstackstart-react";
import { IconMessage } from "@tabler/icons-react";
import { useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getPrivacyPreferences } from "~/utils/privacy";

export function FeedbackButton(props: ButtonProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const privacyPrefs = getPrivacyPreferences();

  const form = useForm({
    mode: "uncontrolled",
    validateInputOnChange: true,
    initialValues: {
      name: "",
      email: "",
      feedback: "",
    },

    validate: {
      name: (value) =>
        value.length > 0 ? null : t("feedback.validation.nameRequired"),
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : t("feedback.validation.emailInvalid"),
      feedback: (value) =>
        value.length > 0 ? null : t("feedback.validation.feedbackRequired"),
    },
  });

  const handleSubmit = async (values: ReturnType<typeof form.getValues>) => {
    // Capture feedback in Sentry
    Sentry.captureFeedback(
      {
        name: values.name,
        email: values.email,
        message: values.feedback,
        source: `feedback-button:${location.pathname}`,
        url: window.location.href,
      },
      {
        // Only include replay if user has enabled session replay
        includeReplay: privacyPrefs.sessionReplay,
        captureContext: {
          tags: {
            invocationId: "feedback-button",
            component: "FeedbackButton",
          },
        },
      }
    );

    notifications.show({
      title: t("feedback.success.title"),
      message: t("feedback.success.message"),
      color: "green",
    });

    form.reset();
    modals.closeAll();
  };

  return (
    <Button
      onClick={() => {
        if (privacyPrefs.errorReporting === false) {
          notifications.show({
            title: t("feedback.enableReporting.title"),
            message: t("feedback.enableReporting.message"),
            color: "red",
          });
        } else {
          modals.open({
            title: t("feedback.modalTitle"),
            children: (
              <Stack>
                <Text size="sm">{t("feedback.description")}</Text>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                  <TextInput
                    withAsterisk
                    label={t("feedback.nameLabel")}
                    placeholder={t("feedback.namePlaceholder")}
                    key={form.key("name")}
                    {...form.getInputProps("name")}
                  />
                  <TextInput
                    withAsterisk
                    label={t("feedback.emailLabel")}
                    placeholder={t("feedback.emailPlaceholder")}
                    key={form.key("email")}
                    {...form.getInputProps("email")}
                  />
                  <Textarea
                    withAsterisk
                    label={t("feedback.feedbackLabel")}
                    placeholder={t("feedback.feedbackPlaceholder")}
                    key={form.key("feedback")}
                    {...form.getInputProps("feedback")}
                  />
                  {privacyPrefs.sessionReplay && (
                    <Text size="sm" c="dimmed" my="md">
                      {t("feedback.replayNote")}
                    </Text>
                  )}
                  <Box my="md">
                    <Button type="submit" fullWidth>
                      {t("feedback.submitButton")}
                    </Button>
                  </Box>
                </form>
              </Stack>
            ),
          });
        }
      }}
      variant="light"
      leftSection={<IconMessage size={16} aria-hidden="true" />}
      {...props}
    >
      {t("feedback.button")}
    </Button>
  );
}
