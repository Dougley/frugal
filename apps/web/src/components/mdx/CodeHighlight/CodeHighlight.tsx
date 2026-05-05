import { CodeHighlight } from "@mantine/code-highlight";
import { Box } from "@mantine/core";
import type { ComponentPropsWithoutRef, ReactElement } from "react";
import styles from "./CodeHighlight.module.css";

export function CodeHighlightBlock({
  children,
}: ComponentPropsWithoutRef<"pre">) {
  const childElement = children as ReactElement<{
    className?: string;
    children: string;
  }>;

  const className = childElement?.props?.className || "";
  const matches = className.match(/language-(?<lang>[\w-]+)/);
  const language = matches?.groups?.lang || "tsx";

  let code = "";
  if (childElement?.props?.children) {
    const childContent = childElement.props.children;
    code =
      typeof childContent === "string" ? childContent : String(childContent);
  }

  code = code.replace(/^\n+/, "").replace(/\n+$/, "");

  return (
    <Box className={styles.container}>
      <CodeHighlight
        code={code}
        language={language}
        withCopyButton
        copyLabel="Copy code"
        copiedLabel="Copied!"
        styles={{
          code: {
            border: "none",
            margin: 0,
            borderRadius: 0,
          },
        }}
      />
    </Box>
  );
}
