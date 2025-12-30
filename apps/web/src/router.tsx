import * as Sentry from "@sentry/tanstackstart-react";
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import SuperJSON from "superjson";
import { RouterNotFound, RouterPending } from "~/components/RouterFallbacks";
import { makeTRPCClient, TRPCProvider } from "~/server/trpc/client";
import type { AppRouter } from "~/server/trpc/router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
      dehydrate: { serializeData: SuperJSON.serialize },
      hydrate: { deserializeData: SuperJSON.deserialize },
    },
  });

  // Create isomorphic TRPC client (server: direct calls, client: HTTP)
  const trpcClient = makeTRPCClient();
  const trpc = createTRPCOptionsProxy<AppRouter>({
    client: trpcClient,
    queryClient,
  });

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    context: {
      trpc,
      queryClient,
    },
    defaultNotFoundComponent: RouterNotFound,
    defaultPendingComponent: RouterPending,
    Wrap: function WrapComponent({ children }) {
      return (
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {children}
        </TRPCProvider>
      );
    },
  });

  // Setup SSR query integration for proper hydration
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  // Initialize Sentry on client-side only
  if (!router.isServer) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      release: import.meta.env.VITE_RELEASE,
      environment: import.meta.env.VITE_ENVIRONMENT ?? "development",
      tunnel: "/api/reporting",
      sendDefaultPii: true,
      enableLogs: true,
      tracePropagationTargets: [
        /^\//, // Same-origin requests (relative URLs)
      ],

      integrations: [
        Sentry.tanstackRouterBrowserTracingIntegration(router),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
        Sentry.feedbackIntegration({
          colorScheme: "system",
          showBranding: false,
          triggerLabel: "Feedback",
          formTitle: "Send Feedback",
          submitButtonLabel: "Send",
          messagePlaceholder: "What's on your mind?",
        }),
      ],

      tracesSampleRate:
        import.meta.env.VITE_ENVIRONMENT === "production" ? 0.2 : 1.0,

      // Capture Replay for 10% of all sessions,
      // plus for 100% of sessions with an error
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }

  return router;
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
