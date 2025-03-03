import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { reactRouterDevTools } from "react-router-devtools";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { remarkAdmonitions } from "./app/lib/remarkAdmonitions";
import { getLoadContext } from "./load-context";

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    sourcemap: true,
    rollupOptions: isSsrBuild
      ? {
          input: "./server.ts",
        }
      : undefined,
  },
  resolve: {
    conditions: ["module", "browser"],
    alias: {
      // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
      "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
    },
  },
  ssr: {
    target: "webworker",
    resolve: {
      conditions: ["workerd", "browser"],
    },
    optimizeDeps: {
      include: [
        "react-router",
        "@mantine/core",
        "@mantine/hooks",
        "@tabler/icons-react",
      ],
    },
  },
  plugins: [
    cloudflareDevProxy({ getLoadContext }),
    reactRouterDevTools(),
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
    reactRouter(),
    tsconfigPaths(),
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "dougley",
      project: "frugal-web",
    }),
  ],
}));
