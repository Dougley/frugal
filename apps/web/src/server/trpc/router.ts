import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { createTRPCRouter } from "~/server/trpc/instance";

import { appMetadataRouter } from "./routers/app";
import { authRouter } from "./routers/auth";
import { giveawaysRouter } from "./routers/giveaways";
import { guildRouter } from "./routers/guild";
import { settingsRouter } from "./routers/settings";
import { templatesRouter } from "./routers/templates";

/**
 * Main app router - composes all sub-routers
 * Procedures are namespaced: example.hello, auth.getGuilds, app.getBuildInfo, etc.
 */
export const appRouter = createTRPCRouter({
  app: appMetadataRouter,
  auth: authRouter,
  giveaways: giveawaysRouter,
  guild: guildRouter,
  settings: settingsRouter,
  templates: templatesRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Inference helpers for input types
 * @example
 * type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
