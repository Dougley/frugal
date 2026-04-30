import { cloudflare } from "@cloudflare/vite-plugin";
import mdx from "@mdx-js/rollup";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig, type PluginOption } from "vite";

import { remarkAdmonitions } from "./src/lib/remarkAdmonitions";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  server: {
    port: 3000,
  },
  worker: {
    format: "es",
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
      "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
    },
  },
  plugins: [
    devtools(),
    cloudflare({
      persistState: {
        path: "../../.mf",
      },
      viteEnvironment: { name: "ssr" },
    }),
    mdx({
      providerImportSource: "@mdx-js/react",
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        remarkGfm,
        remarkAdmonitions,
      ],
      rehypePlugins: [],
    }),
    tanstackStart(),
    viteReact(),
    // Cast needed due to Sentry plugin depending on older vite types
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }) as PluginOption,
  ],
});
