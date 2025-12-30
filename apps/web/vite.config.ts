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
import tsConfigPaths from "vite-tsconfig-paths";

import { remarkAdmonitions } from "./src/lib/remarkAdmonitions";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  // Expose build-time environment variables to client code
  define: {
    "import.meta.env.VITE_ENVIRONMENT": JSON.stringify(
      process.env.CLOUDFLARE_ENV ?? "development"
    ),
    "import.meta.env.VITE_RELEASE": JSON.stringify(
      process.env.RELEASE ?? process.env.CF_PAGES_COMMIT_SHA ?? undefined
    ),
    "import.meta.env.VITE_SITE_URL": JSON.stringify(
      process.env.SITE_URL ?? "https://giveaway.bot"
    ),
    "import.meta.env.VITE_DISCORD_APP_ID": JSON.stringify(
      process.env.DISCORD_APP_ID ?? ""
    ),
  },
  server: {
    port: 3000,
  },
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
      "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
    },
  },
  plugins: [
    devtools(),
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
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
