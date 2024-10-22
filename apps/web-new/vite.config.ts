import mdx from "@mdx-js/rollup";
import type { Options } from "@r4ai/remark-callout";
import remarkCallouts from "@r4ai/remark-callout";
import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import rehypePrettyCode from "rehype-pretty-code";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { remixDevTools } from "remix-development-tools";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { getLoadContext } from "./load-context";

export default defineConfig({
  plugins: [
    remixCloudflareDevProxy({ getLoadContext }),
    remixDevTools(),
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
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
      },
    }),
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
