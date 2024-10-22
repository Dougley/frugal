import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: import.meta.env.SENTRY_DSN,
  tracesSampleRate: 1,
  autoInstrumentRemix: true,
  // functions currently only fire in prod,
  // see https://github.com/remix-run/remix/discussions/9309
  tunnel: import.meta.env.PROD ? "/api/reporting" : undefined,
});
