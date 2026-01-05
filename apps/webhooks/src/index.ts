/// <reference types="../worker-configuration.d.ts" />

import { cleanupOldSubscriptionEvents } from "@dougley/frugal-subscriptions";
import * as Sentry from "@sentry/cloudflare";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { discordMonetizationHandler } from "./handlers/discord-monetization";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", contextStorage());

app.use(
  "/health",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.use("*", async (c, next) => {
  Sentry.instrumentD1WithSentry(c.env.D1);
  await next();
});

app.post("/discord/monetization", discordMonetizationHandler);

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: c.env.CF_VERSION_METADATA?.id || "unknown",
  });
});

app.notFound((c) => {
  return c.text("Not Found", 404);
});

export default Sentry.withSentry(
  (env: Env) => {
    const { id: versionId } = env.CF_VERSION_METADATA;
    return {
      dsn: env.SENTRY_DSN,
      release: versionId,
      tracesSampleRate: 1.0,
      sendDefaultPii: true,
    };
  },
  {
    fetch: app.fetch,
    async scheduled(_event, env, _ctx) {
      console.log("Running scheduled cleanup of old subscription events");

      try {
        await cleanupOldSubscriptionEvents(env.D1, 30); // Keep 30 days of events
        console.log("Scheduled cleanup completed successfully");
      } catch (error) {
        console.error("Scheduled cleanup failed:", error);
        Sentry.captureException(error);
        throw error;
      }
    },
  } satisfies ExportedHandler<Env>
);
