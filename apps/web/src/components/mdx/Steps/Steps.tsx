import { Avatar, Box, Group, Stack } from "@mantine/core";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import styles from "./Steps.module.css";

interface StepsProps {
  children: ReactNode;
}

export function Steps({ children }: StepsProps) {
  // Extract steps from children - handle both direct children and ul > li structure
  let steps: ReactNode[] = [];

  const processChildren = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;

      const element = child as ReactElement<{
        children?: ReactNode;
        mdxType?: string;
      }>;

      // If it's a ul, process its children
      if (element.type === "ul" || element.props.mdxType === "ul") {
        processChildren(element.props.children);
      }
      // If it's an li, add it to steps
      else if (element.type === "li" || element.props.mdxType === "li") {
        steps.push(element.props.children);
      }
    });
  };

  processChildren(children);

  // If no list items found, treat each child as a step
  if (steps.length === 0) {
    steps = Children.toArray(children).filter(
      (child) => isValidElement(child) || typeof child === "string"
    );
  }

  return (
    <Stack gap="lg" my="xl" className={styles.container}>
      {steps.map((step, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Steps are sequential and index is semantically correct
        <Group key={`step-${index}`} align="flex-start" wrap="nowrap" gap="md">
          <Box className={styles.avatarWrapper}>
            <Avatar
              size="md"
              radius="xl"
              color="blue"
              variant="filled"
              styles={{
                root: {
                  flexShrink: 0,
                },
              }}
            >
              {index + 1}
            </Avatar>
            {index < steps.length - 1 && <Box className={styles.connector} />}
          </Box>
          <Box className={styles.stepContent}>{step}</Box>
        </Group>
      ))}
    </Stack>
  );
}
