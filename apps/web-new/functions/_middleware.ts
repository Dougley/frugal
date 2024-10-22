import * as Sentry from "@sentry/cloudflare";

export const onRequest = [
  // Make sure Sentry is the first middleware
  Sentry.sentryPagesPlugin<
    WebEnv & {
      CF_PAGES: 1 | undefined;
      CF_PAGES_BRANCH: string | undefined;
      CF_PAGES_COMMIT_SHA: string | undefined;
      SENTRY_DSN: string | undefined;
    }
  >((context) => ({
    dsn: context.env.SENTRY_DSN,
    debug: process.env.NODE_ENV === "development",
    // Set tracesSampleRate to 1.0 to capture 100% of spans for tracing.
    tracesSampleRate: 1.0,
    environment: context.env.SENTRY_DSN
      ? context.env.CF_PAGES_BRANCH === "main"
        ? "production"
        : "staging"
      : "unknown",
    release: context.env.CF_PAGES ? context.env.CF_PAGES_COMMIT_SHA : "unknown",
    // functions currently only fire in prod,
    // see https://github.com/remix-run/remix/discussions/9309
    tunnel: context.env.CF_PAGES ? "/api/reporting" : undefined,
  })),
  // Add more middlewares here
];
