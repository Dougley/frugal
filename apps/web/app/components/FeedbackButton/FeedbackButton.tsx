import { Button, Modal, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import * as Sentry from "@sentry/react";
import { IconMessage } from "@tabler/icons-react";
import { useState } from "react";

export function FeedbackButton() {
  const [opened, { open, close }] = useDisclosure(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState("");

  const handleSubmit = () => {
    Sentry.captureFeedback(
      {
        name,
        email,
        message: comments,
      },
      {
        includeReplay: true,
        captureContext: {
          tags: {
            invocationId: "feedback-button",
            component: "FeedbackButton",
          },
        },
      },
    );

    notifications.show({
      title: "Thank you!",
      message: "Your feedback has been submitted.",
      color: "green",
    });

    // Reset form
    setName("");
    setEmail("");
    setComments("");
    close();
  };

  return (
    <>
      <Button
        onClick={open}
        variant="light"
        leftSection={<IconMessage size={16} />}
      >
        Send Feedback
      </Button>
      <Modal opened={opened} onClose={close} title="Send Feedback">
        <Stack>
          <Text size="sm">Found a bug? Have a suggestion? Let us know!</Text>
          <TextInput
            label="Name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />

          <TextInput
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            error={
              email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                ? "Please enter a valid email address"
                : null
            }
          />

          <Textarea
            label="Comments"
            placeholder="Tell us what you think..."
            minRows={4}
            value={comments}
            onChange={(e) => setComments(e.currentTarget.value)}
          />

          <Text c="dimmed" size="sm">
            Feedback provided this way will be sent via Sentry.
          </Text>

          <Button onClick={handleSubmit} fullWidth>
            Submit Feedback
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
