import { resolve } from "node:path";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { TEST_KEYPAIR } from "@dougley/frugal-test-utils";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Set root to the monorepo root so SQL files in packages/* are within Vite's root.
  // Without this, vitest-pool-workers resolves them via @fs/ URLs and a path.join bug
  // corrupts the specifier (apps/discord/@fs/home/...) causing "No such module" errors.
  root: resolve(__dirname, "../.."),
  plugins: [
    {
      // Transforms .sql imports to `export default "<content>"` so Vite can bundle them.
      name: "sql-raw",
      transform(code, id) {
        if (id.endsWith(".sql")) {
          return { code: `export default ${JSON.stringify(code)};`, map: null };
        }
      },
    },
    cloudflareTest({
      wrangler: { configPath: resolve(__dirname, "./wrangler.jsonc") },
      miniflare: {
        bindings: {
          DISCORD_PUBLIC_KEY: TEST_KEYPAIR.publicKey,
          DISCORD_APP_ID: "000000000000000004",
          DISCORD_BOT_TOKEN: "test-bot-token",
          DEVELOPMENT_GUILD: "000000000000000002",
          PREMIUM_SKU_ID: "test-sku-id",
        },
      },
    }),
  ],
  test: {
    name: "frugal-discord-app-tests",
    // Include pattern is relative to root (monorepo root), not this config's directory.
    include: ["apps/discord/src/__tests__/**/*.test.ts"],
    passWithNoTests: false,
  },
});
