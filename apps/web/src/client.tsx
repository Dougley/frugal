/// <reference types="vite/client" />

import { StartClient } from "@tanstack/react-start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

// Sentry client-side initialization is done in router.tsx using the
// official @sentry/tanstackstart-react package with router.isServer check

hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>
);
