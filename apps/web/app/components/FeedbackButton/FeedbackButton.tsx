// import { Button, Modal, Stack, Text, Textarea, TextInput } from "@mantine/core";
// import { useDisclosure } from "@mantine/hooks";
// import { notifications } from "@mantine/notifications";
// import * as Sentry from "@sentry/react";
// import { IconMessage } from "@tabler/icons-react";
// import { useState } from "react";

// export function FeedbackButton() {
//   const [opened, { open, close }] = useDisclosure(false);
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [comments, setComments] = useState("");

//   const handleSubmit = () => {
//     Sentry.captureFeedback(
//       {
//         name,
//         email,
//         message: comments,
//       },
//       {
//         includeReplay: true,
//         captureContext: {
//           tags: {
//             invocationId: "feedback-button",
//             component: "FeedbackButton",
//           },
//         },
//       },
//     );

//     notifications.show({
//       title: "Thank you!",
//       message: "Your feedback has been submitted.",
//       color: "green",
//     });

//     // Reset form
//     setName("");
//     setEmail("");
//     setComments("");
//     close();
//   };

//   return (
//     <>
//       <Button
//         onClick={open}
//         variant="light"
//         leftSection={<IconMessage size={16} />}
//       >
//         Send Feedback
//       </Button>
//       <Modal opened={opened} onClose={close} title="Send Feedback">
//         <Stack>
//           <Text size="sm">Found a bug? Have a suggestion? Let us know!</Text>
//           <TextInput
//             label="Name"
//             placeholder="Your name"
//             value={name}
//             onChange={(e) => setName(e.currentTarget.value)}
//           />

//           <TextInput
//             label="Email"
//             placeholder="your@email.com"
//             value={email}
//             onChange={(e) => setEmail(e.currentTarget.value)}
//             error={
//               email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
//                 ? "Please enter a valid email address"
//                 : null
//             }
//           />

//           <Textarea
//             label="Comments"
//             placeholder="Tell us what you think..."
//             minRows={4}
//             value={comments}
//             onChange={(e) => setComments(e.currentTarget.value)}
//           />

//           <Text c="dimmed" size="sm">
//             Feedback provided this way will be sent via Sentry.
//           </Text>

//           <Button onClick={handleSubmit} fullWidth>
//             Submit Feedback
//           </Button>
//         </Stack>
//       </Modal>
//     </>
//   );
// }

import { Button, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { Turnstile } from "@marsidev/react-turnstile";
import * as Sentry from "@sentry/react";
import { IconMessage } from "@tabler/icons-react";
import { useRef } from "react";

export function FeedbackButton() {
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

    form.reset();
    modals.closeAll();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const turnstileControl = useRef<any>(null);

  return (
    <Button
      onClick={() =>
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
                <Turnstile
                  ref={turnstileControl}
                  siteKey="3x00000000000000000000FF"
                />
                <Button type="submit" fullWidth>
                  Submit Feedback
                </Button>
              </form>
            </Stack>
          ),
        })
      }
      variant="light"
      leftSection={<IconMessage size={16} />}
    >
      Send Feedback
    </Button>
  );
}
