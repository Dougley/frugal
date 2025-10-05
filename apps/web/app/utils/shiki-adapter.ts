import { createShikiAdapter } from "@mantine/code-highlight";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

// Fine-grained bundle approach for optimal bundle size
// Only imports the languages we actually use in our docs
async function loadShiki() {
  const shiki = await createHighlighterCore({
    themes: [
      import("@shikijs/themes/github-dark"),
      import("@shikijs/themes/github-light"),
    ],
    langs: [
      // Core web languages used in documentation
      import("@shikijs/langs/typescript"),
      import("@shikijs/langs/javascript"),
      import("@shikijs/langs/tsx"),
      import("@shikijs/langs/jsx"),
      import("@shikijs/langs/bash"),
      import("@shikijs/langs/json"),
      import("@shikijs/langs/html"),
      import("@shikijs/langs/css"),
      import("@shikijs/langs/scss"),
      import("@shikijs/langs/yaml"),
      import("@shikijs/langs/markdown"),
      import("@shikijs/langs/sql"),
      import("@shikijs/langs/dockerfile"),
      import("@shikijs/langs/graphql"),
      import("@shikijs/langs/diff"),
    ],
    engine: createOnigurumaEngine(import("shiki/wasm")),
  });

  return shiki;
}

export const shikiAdapter = createShikiAdapter(loadShiki);
