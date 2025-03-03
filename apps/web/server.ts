import { withSentry } from "@sentry/cloudflare";
import { createRequestHandler } from "react-router";
import { getLoadContext } from "./load-context";

const handleRemixRequest = createRequestHandler(
  // @ts-expect-error - virtual module provided by React Router at build time
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

const functionRoutes = import.meta.glob<{
  default: ExportedHandlerFetchHandler<Env>;
}>("./functions/**/*.ts");

export default withSentry(
  (env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  }),
  {
    // @ts-expect-error - type mismatch due to `withSentry` wrapper
    async fetch(request, env, ctx) {
      try {
        const loadContext = getLoadContext({
          request,
          context: {
            cloudflare: {
              // This object matches the return value from Wrangler's
              // `getPlatformProxy` used during development via Remix's
              // `cloudflareDevProxyVitePlugin`:
              // https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy
              cf: request.cf,
              ctx: {
                waitUntil: ctx.waitUntil.bind(ctx),
                passThroughOnException: ctx.passThroughOnException.bind(ctx),
              },
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
