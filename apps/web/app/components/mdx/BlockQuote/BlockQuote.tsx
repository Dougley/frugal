import { Blockquote } from "@mantine/core";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconBulb,
  IconExclamationCircle,
  IconInfoCircle,
} from "@tabler/icons-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./BlockQuote.module.css";

type AdmonitionType = "note" | "tip" | "important" | "warning" | "caution";

interface BlockQuoteProps extends ComponentPropsWithoutRef<"blockquote"> {
  type?: AdmonitionType;
  children: ReactNode;
  "data-type"?: AdmonitionType;
}

const iconMap = {
  note: IconInfoCircle,
  tip: IconBulb,
  important: IconExclamationCircle,
  warning: IconAlertTriangle,
  caution: IconAlertCircle,
};

const colorMap = {
  note: "blue",
  tip: "green",
  important: "yellow",
  warning: "orange",
  caution: "red",
};

export function BlockQuote({
  type = "note",
  children,
  "data-type": dataType,
  ...others
}: BlockQuoteProps) {
  const finalType = dataType || type;
  const Icon = iconMap[finalType];

  return (
    <Blockquote
      icon={<Icon />}
      mt="xl"
      color={colorMap[finalType]}
      iconSize={35}
      className={styles.root}
      {...others}
    >
      {children}
    </Blockquote>
  );
}
