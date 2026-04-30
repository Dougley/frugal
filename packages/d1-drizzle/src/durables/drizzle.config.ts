// eslint-disable-next-line import/no-unresolved
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/durables/drizzle",
  schema: "./src/durables/schema.ts",
  dialect: "sqlite",
  driver: "durable-sqlite",
});
