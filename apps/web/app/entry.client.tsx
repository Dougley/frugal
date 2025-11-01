/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import {
  browserTracingIntegration,
  init,
  replayIntegration,
} from "@sentry/react";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { getPrivacyPreferences } from "./utils/privacy";

// Get privacy preferences before initializing Sentry
const privacyPrefs = getPrivacyPreferences();

// Only initialize Sentry if error reporting is enabled
if (privacyPrefs.errorReporting) {
  const integrations = [];

  // Add performance tracing if enabled
  if (privacyPrefs.performanceTracing) {
    integrations.push(browserTracingIntegration());
  }

  // Add session replay if enabled
  if (privacyPrefs.sessionReplay) {
    integrations.push(
      replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      })
    );
  }

  init({
    //debug: import.meta.env.DEV,

    dsn: import.meta.env.VITE_SENTRY_DSN,
    // Only enable traces if performance tracing is enabled
    tracesSampleRate: privacyPrefs.performanceTracing ? 1 : 0,
    tunnel: import.meta.env.DEV ? undefined : "/api/reporting",

    integrations,

    // Only enable replay if session replay is enabled
    replaysSessionSampleRate: privacyPrefs.sessionReplay ? 0.1 : 0,
    replaysOnErrorSampleRate: privacyPrefs.sessionReplay ? 1 : 0,
  });
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
