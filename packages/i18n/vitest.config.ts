import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    exclude: ["**/dist/**", "**/node_modules/**"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/example.ts", "dist/"],
    },
  },
});
