/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";

const ABORT_DELAY = 5000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ABORT_DELAY);

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: controller.signal,
      onError(error: unknown) {
        if (!controller.signal.aborted) {
          console.error(error);
        }
        responseStatusCode = 500;
      },
    }
  );

  body.allReady.then(() => clearTimeout(timeoutId));

  if (isbot(request.headers.get("user-agent") || "")) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");

  // other global response headers
  // one in 10 requests, add the CSP header for sentry
  if (
    Math.floor(Math.random() * 10) === 0 &&
    loadContext.cloudflare.env.SENTRY_DSN
  ) {
    // a dns looks like https://aaa@bb.ingest.us.sentry.io/ccc
    // a CSP header should look like https://bb.ingest.us.sentry.io/api/ccc/security/?sentry_key=aaa
    const sentryDsn = loadContext.cloudflare.env.SENTRY_DSN;
    const url = new URL(sentryDsn);
    const publicKey = url.username;
    const host = url.host;
    const projectId = url.pathname.slice(1); // remove leading slash
    const cspUrl = `https://${host}/api/${projectId}/security/?sentry_key=${publicKey}`;
    responseHeaders.set(
      "Content-Security-Policy-Report-Only", // we dont enforce CSP yet, just report
      `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${cspUrl}; report-uri ${cspUrl}`
    );
  }

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
