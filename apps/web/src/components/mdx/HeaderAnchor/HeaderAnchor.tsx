import { ActionIcon, Box, Title } from "@mantine/core";
import { IconLink } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";
import styles from "./HeaderAnchor.module.css";

interface HeaderAnchorProps {
  id: string;
  children: ReactNode;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export function HeaderAnchor({ id, children, level }: HeaderAnchorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Update URL without scrolling
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <Box className={styles.headerAnchorGroup}>
      <Title
        order={level}
        id={id}
        style={{ scrollMarginTop: "var(--mantine-spacing-xl)" }}
        mt="xl"
        mb="md"
      >
        {children}
        <ActionIcon
          variant="subtle"
          color={copied ? "indigo" : "gray"}
          size="sm"
          onClick={handleCopyLink}
          aria-label={copied ? "Link copied!" : "Copy link to heading"}
          className={styles.headerAnchorButton}
          ml={8}
        >
          <IconLink size={16} aria-hidden="true" />
        </ActionIcon>
      </Title>
    </Box>
  );
}

// Utility function to generate URL-friendly IDs from heading text
export function generateHeadingId(text: string | ReactNode): string {
  // Convert ReactNode to string
  const textContent =
    typeof text === "string" ? text : extractTextFromNode(text);

  return textContent
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

function extractTextFromNode(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromNode).join("");

  if (node && typeof node === "object" && "props" in node) {
    const element = node as { props?: { children?: ReactNode } };
    return extractTextFromNode(element.props?.children);
  }

  return "";
}
