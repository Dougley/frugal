# Sentry w/ Toucan + Remix + Cloudflare Pages

This is a set of overrides and helpers to get Sentry working with Remix and Cloudflare Pages, using Toucan as the hub.

This is heavily based on the work from [huw](https://gist.github.com/huw/e6749ea2e205e0179d0c87c3a9859f9e), thanks!

This package is designed to work with remix version 2.0.0 and above, if you are using an older version of remix, please enable all the future flags in your `remix.config.ts` file.

## Usage

We use a mix of Sentry's own packages and this package to get everything working, so you'll need to install both this package and `@sentry/remix`.

### `server.ts`

- Rewrite your `onRequest` function to use `handleFetch`, which is a wrapper around `createPagesFunctionHandler` that will catch errors and send them to Sentry.

  > **Warning**
  > Your loadContext **MUST** include a `sentry` property that is an instance of Toucan.

  <details>
  <summary>Example</summary>

  ```ts
  import { handleFetch } from "@dougley/sentry-remix";
  import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
  import * as build from "@remix-run/dev/server-build";
  import { Toucan } from "toucan-js";

  export const onRequest = async (context: EventContext) => {
    const sentry = new Toucan({
      dsn: context.env.SENTRY_DSN,
      environment: context.env.SENTRY_ENVIRONMENT,
      release: context.env.SENTRY_RELEASE,
      // if you need any other options, add them here
      // for example, to enable tracing:
      tracesSampleRate: 1.0,
    });

    const pagesHandler = createPagesFunctionHandler({
      build,
      mode: process.env.NODE_ENV,
      getLoadContext: (context) => {
        return { ...context.env, sentry };
      },
    });

    return handleFetch(
      sentry, // Toucan instance
      context,
      context.request,
      pagesHandler, // CF pages handler you created with createPagesFunctionHandler
      build,
    );
  };
  ```

  </details>

### `entry.server.tsx`

- Import the SSR provider from `@dougley/sentry-remix` and wrap your app with it.

  <details>
  <summary>Example</summary>

  ```tsx
  import { SentrySSRContext } from "@dougley/sentry-remix";
  import { RemixServer } from "@remix-run/react";
  import { renderToReadableStream } from "react-dom/server";

  const body = await renderToReadableStream(
    <SentrySSRContext.Provider value={loadContext.sentry}>
      <RemixServer context={remixContext} url={request.url} />
    </SentrySSRContext.Provider>,
    {
      signal: request.signal,
      onError: (error) => {
        // Don't capture errors with Sentry here; they'll be handled by Remix.
        updatedResponseStatusCode = 500;
      },
    },
  );
  ```

  </details>

- Export the `handleError` function from `@dougley/sentry-remix` to handle server-side errors.

  <details>
  <summary>Example</summary>

  ```ts
  export { handleError } from "@dougley/sentry-remix";
  ```

  </details>

### `root.tsx`

- Create a new `useEffect` hook to initalize Sentry for the client.

  <details>
  <summary>Example</summary>

  ```tsx
  import {
    BrowserTracing,
    init as initSentry,
    remixRouterInstrumentation,
  } from "@sentry/remix";
  import { useEffect } from "react";

  const Root = () => {
    useEffect(() => {
      initSentry({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT,
        release: process.env.SENTRY_RELEASE,
        integrations: [
          new BrowserTracing({
            routingInstrumentation: remixRouterInstrumentation(
              useEffect,
              useLocation,
              useMatches,
            ),
            tracePropagationTargets: [
              new RegExp(
                `^https?://${new URL(window.location.href).host}`,
                "u",
              ),
            ],
          }),
        ],
        // if you need any other options, add them here
        // for example, to enable tracing:
        tracesSampleRate: 1.0,
      });
    }, []);

    return (
      <div>
        <Outlet />
      </div>
    );
  };
  ```

  </details>

- Edit your existing, or create a new `ErrorBoundary` component that uses `captureRemixErrorBoundaryError` to send errors to Sentry.

  <details>
  <summary>Example</summary>

  ```tsx
  import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
  import { captureRemixErrorBoundaryError } from "@dougley/sentry-remix";

  export const ErrorBoundary = (() => {
    const error = useRouteError();
    captureRemixErrorBoundaryError(error);

    const errorMessage = isRouteErrorResponse(error)
      ? `${error.status} ${error.statusText}`
      : "Sorry, something went wrong.";

    return (
      <Page>
        <div>
          <h3>
            {errorMessage}
          </h3>
      </Page>
    );
  });
  ```

  </details>

- Wrap your app with `withSentry`

  <details>
  <summary>Example</summary>

  ```tsx
  import { withProfiler } from "@sentry/react";
  import { withSentry } from "@sentry/remix";

  export default withSentry(withProfiler(Root), {
    wrapWithErrorBoundary: false, // important! sentry's default errorBoundary is not V2 compatible
  });
  ```

  </details>
