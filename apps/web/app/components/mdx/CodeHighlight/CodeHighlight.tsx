import { CodeHighlight } from "@mantine/code-highlight";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./CodeHighlight.module.css";

export function CodeHighlightBlock({
  children,
  ...props
}: ComponentPropsWithoutRef<"pre">) {
  const language = (children: any) => {
    const matches = (children.props.className || "").match(
      /language-(?<lang>.*)/,
    );
    const matchedLanguage =
      matches && matches.groups && matches.groups.lang
        ? matches.groups.lang
        : "tsx";

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
        // @ts-expect-error
        code={children?.props.children}
        language={language(children)}
      />
    </div>
  );
}
