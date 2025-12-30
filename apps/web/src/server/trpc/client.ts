import { env } from "cloudflare:workers";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import {
  createTRPCClient,
  httpBatchStreamLink,
  loggerLink,
  unstable_localLink,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { createAuth } from "../auth";
import { createDb } from "../db";
import { createTRPCContext as createServerContext } from "./context";
import type { AppRouter } from "./router";
import { appRouter } from "./router";

/**
 * Creates an isomorphic TRPC client that:
 * - On the server: uses `unstable_localLink` to call the router directly (no HTTP)
 * - On the client: uses `httpBatchStreamLink` to make HTTP requests to /api/trpc
 *
 * This pattern is essential for Cloudflare Workers where the server cannot
 * make HTTP requests back to itself during SSR.
 *
 * Server-side calls now have access to cookies via getRequestHeaders(),
 * enabling authenticated tRPC calls during SSR prefetch.
 */
export const makeTRPCClient = createIsomorphicFn()
  .server(() => {
    return createTRPCClient<AppRouter>({
      links: [
        unstable_localLink({
          router: appRouter,
          transformer: superjson,
          createContext: async () => {
            // Get request headers including cookies for auth
            const headers = new Headers(getRequestHeaders());
            headers.set("x-trpc-source", "tanstack-start-server");

            // Fetch session from Better Auth using the request headers
            const auth = createAuth(env);
            const sessionData = await auth.api.getSession({
              headers,
              query: {
                // Disable cookie cache to ensure fresh session data
                disableCookieCache: true,
              },
            });

            // Create database instance
            const db = createDb(env.D1);

            console.log("[TRPC] Server-side call via unstable_localLink", {
              hasSession: !!sessionData?.session,
              hasUser: !!sessionData?.user,
              userId: sessionData?.user?.id,
            });

            return createServerContext(
              {
                env,
                cf: null,
              },
              sessionData?.session ?? null,
              sessionData?.user ?? null,
              headers,
              db
            );
          },
        }),
      ],
    });
  })
  .client(() => {
    return createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            import.meta.env.DEV ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: superjson,
          url: "/api/trpc",
          // Include credentials (cookies) for auth
          fetch: (url, options) =>
            fetch(url, { ...options, credentials: "include" }),
          headers() {
            const headers = new Headers();
            headers.set("x-trpc-source", "tanstack-start-client");
            return headers;
          },
        }),
      ],
    });
  });

// Re-export the TRPC context hook and provider for use in components
export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();
