import { resolve } from "node:path";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Set root to the monorepo root — same reason as apps/discord/vitest.config.ts.
  root: resolve(__dirname, "../.."),
  plugins: [
    {
      name: "sql-raw",
      transform(code, id) {
        if (id.endsWith(".sql")) {
          return { code: `export default ${JSON.stringify(code)};`, map: null };
        }
      },
    },
    cloudflareTest({
      wrangler: {
        configPath: resolve(__dirname, "../../apps/discord/wrangler.jsonc"),
      },
      miniflare: {
        bindings: {
          DISCORD_PUBLIC_KEY: "test-key",
          DISCORD_APP_ID: "000000000000000004",
          DISCORD_BOT_TOKEN: "test-bot-token",
          DEVELOPMENT_GUILD: "000000000000000002",
          PREMIUM_SKU_ID: "test-sku-id",
        },
      },
    }),
  ],
  test: {
    include: ["packages/giveaway-state-v3/src/__tests__/**/*.test.ts"],
  },
});
