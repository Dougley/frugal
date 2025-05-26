/// <reference types="../worker-configuration.d.ts" />

import { withSentry } from "@sentry/cloudflare";
import { createRequestHandler } from "react-router";
import { getLoadContext } from "./load-context";

const handleRemixRequest = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

const functionRoutes = import.meta.glob<{
  default: ExportedHandlerFetchHandler<Env>;
}>("../functions/**/*.ts");

export default withSentry(
  (env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    debug: import.meta.env.DEV,
  }),
  {
    // @ts-expect-error - type mismatch due to `withSentry` wrapper
    async fetch(request, env, ctx) {
      try {
        const loadContext = getLoadContext({
          request,
          context: {
            cloudflare: {
              cf: request.cf,
              ctx,
              caches,
              env,
            },
          },
        });
        const url = new URL(request.url);
        if (functionRoutes.hasOwnProperty(`./functions${url.pathname}.ts`)) {
          const functionRoute = functionRoutes[`./functions${url.pathname}.ts`];
          if (functionRoute) {
            return await functionRoute().then((fn) =>
              fn.default(request, env, ctx),
            );
          }
        } else {
          return await handleRemixRequest(request, loadContext);
        }
      } catch (error) {
        console.log(error);
        return new Response("An unexpected error occurred", { status: 500 });
      }
    },
  } satisfies ExportedHandler<Env>,
);
