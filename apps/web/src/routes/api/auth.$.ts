import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

import { createAuth } from "~/server/auth";
import type { RequestContext } from "~/server/request-context";

/**
 * Better Auth API route handler for TanStack Start
 *
 * Handles all auth routes under /api/auth/*:
 * - /api/auth/signin/discord - Discord OAuth initiation
 * - /api/auth/callback/discord - OAuth callback
 * - /api/auth/session - Get current session
 * - /api/auth/signout - End session
 * - /api/auth/access-token - Get OAuth access token
 */
const handleRequest = (request: Request, ctx: RequestContext) => {
  const auth = createAuth(ctx.env);
  return auth.handler(request);
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

export const Route = createFileRoute("/api/auth/$")({
  server: {
    middleware: [requestContextMiddleware],
    handlers: {
      GET: ({ request, context }) => handleRequest(request, context),
      POST: ({ request, context }) => handleRequest(request, context),
    },
  },
});
