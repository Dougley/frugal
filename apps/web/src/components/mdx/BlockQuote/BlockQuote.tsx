import { Blockquote, Stack, Text } from "@mantine/core";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconBulb,
  IconCheck,
  IconExclamationCircle,
  IconHelpCircle,
  IconInfoCircle,
} from "@tabler/icons-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./BlockQuote.module.css";

type AdmonitionType =
  | "note"
  | "tip"
  | "important"
  | "warning"
  | "caution"
  | "success"
  | "info"
  | "danger"
  | "question";

interface BlockQuoteProps extends ComponentPropsWithoutRef<"blockquote"> {
  type?: AdmonitionType;
  title?: string;
  children: ReactNode;
  "data-type"?: AdmonitionType;
}

const iconMap = {
  note: IconInfoCircle,
  tip: IconBulb,
  important: IconExclamationCircle,
  warning: IconAlertTriangle,
  caution: IconAlertCircle,
  success: IconCheck,
  info: IconInfoCircle,
  danger: IconAlertCircle,
  question: IconHelpCircle,
};

const colorMap = {
  note: "indigo",
  tip: "lime",
  important: "amber",
  warning: "orange",
  caution: "red",
  success: "lime",
  info: "cyan",
  danger: "red",
  question: "violet",
};

const titleMap = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
  success: "Success",
  info: "Info",
  danger: "Danger",
  question: "Question",
};

export function BlockQuote({
  type = "note",
  title,
  children,
  "data-type": dataType,
  ...others
}: BlockQuoteProps) {
  const finalType = dataType || type;
  const Icon = iconMap[finalType];
  const displayTitle = title || titleMap[finalType];

  return (
    <Blockquote
      icon={<Icon aria-hidden="true" />}
      mt="xl"
      color={colorMap[finalType]}
      iconSize={35}
      className={styles.root}
      {...others}
    >
      <Stack gap="xs">
        {displayTitle && (
          <Text fw={700} fz="lg" c={`${colorMap[finalType]}.7`} mb={-5}>
            {displayTitle}
          </Text>
        )}
        <div>{children}</div>
      </Stack>
    </Blockquote>
  );
}
