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
import * as Sentry from "@sentry/react";
import { IconMessage } from "@tabler/icons-react";
import { getPrivacyPreferences } from "~/utils/privacy";

export function FeedbackButton(props: ButtonProps) {
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
      name: (value) => (value.length > 0 ? null : "Name is required"),
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Invalid email address",
      feedback: (value) => (value.length > 0 ? null : "Feedback is required"),
    },
  });

  const handleSubmit = async (values: ReturnType<typeof form.getValues>) => {
    // Capture feedback in Sentry
    Sentry.captureFeedback(
      {
        email: values.email,
        message: values.feedback,
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
      title: "Thank you!",
      message: "Your feedback has been submitted.",
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
            title: "Enable Error Reporting",
            message:
              "Please enable error reporting in your privacy settings to submit feedback.",
            color: "red",
          });
        } else {
          modals.open({
            title: "Send Feedback",
            children: (
              <Stack>
                <Text size="sm">
                  Found a bug? Have a suggestion? Let us know!
                </Text>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                  <TextInput
                    withAsterisk
                    label="Name"
                    placeholder="Your name"
                    key={form.key("name")}
                    {...form.getInputProps("name")}
                  />
                  <TextInput
                    withAsterisk
                    label="Email"
                    placeholder="your@email.com"
                    key={form.key("email")}
                    {...form.getInputProps("email")}
                  />
                  <Textarea
                    withAsterisk
                    label="Feedback"
                    placeholder="Tell us what you think..."
                    key={form.key("feedback")}
                    {...form.getInputProps("feedback")}
                  />
                  {privacyPrefs.sessionReplay && (
                    <Text size="sm" c="dimmed" my="md">
                      Heads up! Since you have session replay enabled, feedback
                      provided this way will be sent along with a session replay
                      to help us better understand any issues.
                    </Text>
                  )}
                  <Box my="md">
                    <Button type="submit" fullWidth>
                      Submit Feedback
                    </Button>
                  </Box>
                </form>
              </Stack>
            ),
          });
        }
      }}
      variant="light"
      leftSection={<IconMessage size={16} />}
      {...props}
    >
      Send Feedback
    </Button>
  );
}
