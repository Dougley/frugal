import { CodeHighlight } from "@mantine/code-highlight";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./CodeHighlight.module.css";

export function CodeHighlightBlock({
  children,
}: ComponentPropsWithoutRef<"pre">) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const language = (children: any) => {
    const matches = (children.props.className || "").match(
      /language-(?<lang>.*)/
    );
    const matchedLanguage = matches?.groups?.lang ? matches.groups.lang : "tsx";

    if (["js", "jsx", "ts", "tsx"].includes(matchedLanguage)) {
      return "tsx";
    }

    if (["css", "scss"].includes(matchedLanguage)) {
      return "scss";
    }

    if (["html", "bash", "json"].includes(matchedLanguage)) {
      return matchedLanguage;
    }

    throw new Error(`Unknown language: ${matchedLanguage}`);
  };

  return (
    <div className={styles.codeBlock}>
      <CodeHighlight
        // @ts-expect-error - children is a ReactNode
        code={children?.props.children}
        language={language(children)}
      />
    </div>
  );
}
