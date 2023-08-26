import { SentrySSRContext } from "@dougley/sentry-remix";
import { type AppLoadContext, type EntryContext } from "@remix-run/cloudflare";
import { RemixServer } from "@remix-run/react";
import isbot from "isbot";
import { renderToReadableStream } from "react-dom/server";

export { handleError } from "@dougley/sentry-remix";

const entry = async (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext,
) => {
  let updatedResponseStatusCode = responseStatusCode;

  const body = await renderToReadableStream(
    // @ts-ignore
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

  if (isbot(request.headers.get("user-agent"))) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: updatedResponseStatusCode,
  });
};

export default entry;
