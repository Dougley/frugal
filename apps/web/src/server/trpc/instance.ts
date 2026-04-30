import * as Sentry from "@sentry/cloudflare";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";

import type { TRPCContext } from "./context";

/**
 * Initialize tRPC with:
 * - SuperJSON transformer for Dates, Maps, Sets, BigInt, etc.
 * - ZodError flattening for better client-side validation error handling
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      // Flatten Zod errors for easier consumption in forms
      zodError:
        error.cause instanceof ZodError ? z.treeifyError(error.cause) : null,
    },
  }),
});

/**
 * Timing middleware - logs procedure execution time
 * In development, adds artificial delay (100-500ms) to help catch waterfall issues
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  // Add artificial delay in dev to simulate network latency
  if (import.meta.env.DEV) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();
  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms`);

  return result;
});

/**
 * Sentry middleware - captures procedure errors and creates spans
 * attachRpcInput includes the procedure input in error reports for debugging
 */
const sentryMiddleware = t.middleware(
  Sentry.trpcMiddleware({ attachRpcInput: true })
);

/**
 * Create a new router
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure - accessible without authentication
 * Includes Sentry and timing middleware for observability
 */
export const publicProcedure = t.procedure
  .use(sentryMiddleware)
  .use(timingMiddleware);

/**
 * Protected procedure - requires authenticated session
 *
 * Type-narrows the context to guarantee session and user exist.
 * Throws UNAUTHORIZED if no session is present.
 *
 * Note: This will NOT work with SSR prefetch via unstable_localLink
 * because localLink doesn't have access to cookies. Protected data
 * must be fetched client-side or passed from loaders.
 */
export const protectedProcedure = t.procedure
  .use(sentryMiddleware)
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session || !ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }

    // Type-narrow context to guarantee session and user exist
    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        user: ctx.user,
      },
    });
  });

// Legacy exports for backwards compatibility during migration
export const router = t.router;
export const mergeRouters = t.mergeRouters;
export const createCallerFactory = t.createCallerFactory;
