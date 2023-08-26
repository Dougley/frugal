import { type ServerBuild } from "@remix-run/cloudflare";
import { createRoutes } from "@remix-run/server-runtime/dist/routes";
import { addTracingExtensions, hasTracingEnabled } from "@sentry/core";
import { type Hub } from "@sentry/types";
import { instrumentBuild } from "./instrumentBuild";
import { startRequestHandlerTransaction } from "./requestHandlerTransaction";
import { getTransactionDetails } from "./transactionDetails";

export const handleFetch = async (
  hub: Hub,
  context: EventContext<Env, any, any>,
  request: Request,
  handleRemixRequest: (
    context: EventContext<Env, any, any>,
  ) => Promise<Response>,
  build: ServerBuild,
) => {
  // This mutates the global object to save tracing methods (ex. `startTransaction`). However, the methods are pure functions (they take the current Hub instance as a parameter) and so having them overwrite if global state is accidentally shared is possibly okay.
  addTracingExtensions();

  try {
    // Wrap each Remix loader and action in a Sentry span
    const instrumentedBuild = instrumentBuild(hub, build);

    // Generate the root transaction for this request
    // Adapted from [the Remix/Express adapter](https://github.com/getsentry/sentry-javascript/blob/7f4c4ec10b97be945dab0dca1d47adb9a9954af3/packages/remix/src/utils/serverAdapters/express.ts)
    const routes = createRoutes(instrumentedBuild.routes);
    const options = hub.getClient()?.getOptions();
    const url = new URL(request.url);
    const { name, source, params } = getTransactionDetails(routes, url);

    // Even if tracing is disabled, we still want to set the route name
    hub.getScope().setSDKProcessingMetadata({
      request,
      route: {
        path: name,
      },
    });

    if (!options || !hasTracingEnabled(options)) {
      return await handleRemixRequest(context);
    }

    // Start the transaction, linking to an ongoing trace if necessary
    const transaction = startRequestHandlerTransaction(
      hub,
      request,
      name,
      source,
      params,
    );
    const response = await handleRemixRequest(context);

    transaction.setHttpStatus(response.status);
    transaction.finish();

    return response;
  } catch (error: unknown) {
    hub.captureException(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
