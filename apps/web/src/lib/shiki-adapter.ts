import {
  type CodeHighlightAdapter,
  stripShikiCodeBlocks,
} from "@mantine/code-highlight";

async function loadShiki() {
  const { createHighlighter } = await import("shiki");
  return createHighlighter({
    langs: ["tsx", "ts", "js", "jsx", "scss", "css", "html", "bash", "json"],
    themes: ["vesper", "vitesse-light"],
  });
}

export const shikiAdapter: CodeHighlightAdapter = {
  loadContext: loadShiki,
  getHighlighter: (ctx) => {
    if (!ctx) {
      return ({ code }) => ({ highlightedCode: code, isHighlighted: false });
    }

    return ({ code, language, colorScheme }) => ({
      isHighlighted: true,
      highlightedCode: stripShikiCodeBlocks(
        ctx.codeToHtml(code, {
          lang: language,
          theme: colorScheme === "dark" ? "vesper" : "vitesse-light",
        })
      ),
    });
  },
};
