import { initTRPC } from "@trpc/server";

import { transformer } from "../transformer";
import type { Context } from "../trpc";

/**
 * Shared TRPC instance for all routers
 */
export const t = initTRPC.context<Context<LegacyEnv>>().create({
  transformer,
});

// Export the type of t for middleware
export type TRPCInstance = typeof t;

export const publicProcedure = t.procedure;
export const router = t.router;
