import { Accordion } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import type { ReactNode } from "react";
import styles from "./Details.module.css";

interface DetailsProps {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Details({
  summary,
  children,
  defaultOpen = false,
  className,
}: DetailsProps) {
  const defaultValue = defaultOpen ? "item" : null;

  return (
    <Accordion
      className={className || styles.accordion}
      variant="separated"
      chevron={<IconChevronDown size={16} aria-hidden="true" />}
      defaultValue={defaultValue}
    >
      <Accordion.Item value="item">
        <Accordion.Control className={styles.control}>
          {summary}
        </Accordion.Control>
        <Accordion.Panel className={styles.panel}>{children}</Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
