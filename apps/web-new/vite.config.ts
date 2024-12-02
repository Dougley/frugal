import mdx from "@mdx-js/rollup";
import type { Options } from "@r4ai/remark-callout";
import remarkCallouts from "@r4ai/remark-callout";
import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { reactRouterDevTools } from "react-router-devtools";
import rehypePrettyCode from "rehype-pretty-code";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { getLoadContext } from "./load-context";

export default defineConfig({
  plugins: [
    cloudflareDevProxy({ getLoadContext }),
    reactRouterDevTools(),
    mdx({
      providerImportSource: "@mdx-js/react",
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        remarkGfm,
        [
          remarkCallouts,
          {
            root: (callout) => {
              return {
                tagName: "callout-root",
                properties: {
                  type: callout.type,
                  isFoldable: callout.isFoldable.toString(),
                  defaultFolded: callout.defaultFolded?.toString(),
                },
              };
            },
            title: (callout) => ({
              tagName: "callout-title",
              properties: {
                type: callout.type,
                isFoldable: callout.isFoldable.toString(),
              },
            }),
            body: (callout) => ({
              tagName: "callout-body",
              properties: {},
            }),
          } satisfies Options,
        ],
      ],
      rehypePlugins: [rehypePrettyCode],
    }),
    reactRouter(),
    tsconfigPaths(),
    sentryVitePlugin({
      org: "dougley",
      project: "frugal-web",
    }),
  ],

  build: {
    sourcemap: true,
  },
});
