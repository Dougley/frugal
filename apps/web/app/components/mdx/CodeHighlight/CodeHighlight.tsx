import { CodeHighlight } from "@mantine/code-highlight";
import { Box } from "@mantine/core";
import type { ComponentPropsWithoutRef, ReactElement } from "react";

// Map of common language aliases to their proper highlight.js language names
const languageMap: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  py: "python",
  rb: "ruby",
  rs: "rust",
  go: "go",
  java: "java",
  c: "c",
  cpp: "cpp",
  cs: "csharp",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  sql: "sql",
  md: "markdown",
  mdx: "markdown",
  html: "html",
  xml: "xml",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",
  json: "json",
  yaml: "yaml",
  toml: "toml",
  graphql: "graphql",
  diff: "diff",
  docker: "dockerfile",
  dockerfile: "dockerfile",
};

export function CodeHighlightBlock({
  children,
}: ComponentPropsWithoutRef<"pre">) {
  // Extract language from className (e.g., "language-typescript")
  const childElement = children as ReactElement<{
    className?: string;
    children: string;
  }>;

  const className = childElement?.props?.className || "";
  const matches = className.match(/language-(?<lang>[\w-]+)/);
  const rawLang = matches?.groups?.lang || "typescript";

  // Map to proper language name
  const language = languageMap[rawLang.toLowerCase()] || rawLang;

  // Get the actual code content - handle both string and nested content
  let code = "";
  if (childElement?.props?.children) {
    const childContent = childElement.props.children;
    code =
      typeof childContent === "string" ? childContent : String(childContent);
  }

  // Remove leading/trailing newlines but preserve internal formatting
  code = code.replace(/^\n+/, "").replace(/\n+$/, "");

  return (
    <Box
      style={{
        border: "1px solid var(--mantine-color-default-border)",
        overflow: "hidden",
        margin: 0,
      }}
    >
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
