import { withSentry } from "@sentry/cloudflare";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { buildRequestContext } from "./server/request-context";

const startEntry = createServerEntry({
  async fetch(request, opts) {
    return handler.fetch(request, opts);
  },
});

export default withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    release: env.CF_VERSION_METADATA?.id,
    environment: env.CLOUDFLARE_ENV ?? env.ENVIRONMENT ?? "development",
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
    enableLogs: true,
  }),
  {
    async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
      const context = await buildRequestContext(request, env);
      return startEntry.fetch(request, { context });
    },
  } satisfies ExportedHandler<Env>
);
