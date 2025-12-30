import { env } from "cloudflare:workers";
import * as Sentry from "@sentry/cloudflare";
import { createFileRoute } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createAuth } from "~/server/auth";
import { createDb } from "~/server/db";
import type { RequestContext } from "~/server/request-context";
import { createTRPCContext } from "~/server/trpc/context";
import { appRouter } from "~/server/trpc/router";

/**
 * TRPC route handler with session injection
 *
 * Fetches the Better Auth session on each request and injects it
 * into the TRPC context for use in procedures.
 */
const handleRequest = async (request: Request, ctx: RequestContext) => {
  // Get session from Better Auth
  const auth = createAuth(ctx.env);
  const sessionData = await auth.api.getSession({
    headers: request.headers,
  });

  // Create database instance
  const db = createDb(ctx.env.D1);

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () =>
      createTRPCContext(
        ctx,
        sessionData?.session ?? null,
        sessionData?.user ?? null,
        request.headers,
        db
      ),
    onError: ({ path, error }) => {
      console.error(`tRPC failed on ${path ?? "<no-path>"}:`, error);
      Sentry.captureException(error, {
        extra: { path },
      });
    },
  });
};

const requestContextMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next, request }) => {
    const cf = (request as Request & { cf?: IncomingRequestCfProperties }).cf;
    return next({
      context: {
        env,
        cf: cf ?? null,
      } satisfies RequestContext,
    });
  }
);

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    middleware: [requestContextMiddleware],
    handlers: {
      GET: async ({ request, context }) => handleRequest(request, context),
      POST: async ({ request, context }) => handleRequest(request, context),
    },
  },
});
