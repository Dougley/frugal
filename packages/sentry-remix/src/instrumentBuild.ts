/**
 * @file Instrument the Remix build with Sentry. Adapted from [`instrumentServer`](https://github.com/getsentry/sentry-javascript/blob/b290fcae0466ecd8026c40b14d87473c130e9207/packages/remix/src/utils/instrumentServer.ts).
 */
import {
  type AppLoadContext,
  type EntryContext,
  type HandleDocumentRequestFunction,
  type ServerBuild,
} from "@remix-run/cloudflare";
import { isCatchResponse, type AppData } from "@remix-run/react/dist/data";
import {
  isRedirectResponse,
  isResponse,
  json,
} from "@remix-run/server-runtime/dist/responses";
import {
  type ActionFunction,
  type LoaderFunctionArgs as LoaderArgs,
  type LoaderFunction,
} from "@remix-run/server-runtime/dist/routeModules";
import { type Hub, type WrappedFunction } from "@sentry/types";
import {
  dynamicSamplingContextToSentryBaggageHeader,
  fill,
} from "@sentry/utils";

// Adapted from [Sentry](https://github.com/getsentry/sentry-javascript/blob/540adac9ec81803f86a3a7f5b34ebbc1ad2a8d23/packages/remix/src/utils/instrumentServer.ts#L120-L170)
const makeWrappedDocumentRequestFunction =
  (hub: Hub) =>
  (
    origDocumentRequestFunction: HandleDocumentRequestFunction,
  ): HandleDocumentRequestFunction => {
    return async function (
      this: unknown,
      request: Request,
      responseStatusCode: number,
      responseHeaders: Headers,
      context: EntryContext,
      loadContext: AppLoadContext,
    ): Promise<Response> {
      const activeTransaction = hub.getScope().getTransaction();

      const span = activeTransaction?.startChild({
        op: "function.remix.document_request",
        description: activeTransaction.name,
        tags: {
          method: request.method,
          url: request.url,
        },
      });

      const response = await origDocumentRequestFunction.call(
        this,
        request,
        responseStatusCode,
        responseHeaders,
        context,
        loadContext,
      );

      span?.finish();

      return response;
    };
  };

// Allow slightly differently typed data functions for loaders & actions, without having to rewrite the code.
interface MakeWrappedDataFunction {
  (
    hub: Hub,
    id: string,
    dataFunctionType: "action",
    originalFunction: ActionFunction,
  ): ActionFunction;
  (
    hub: Hub,
    id: string,
    dataFunctionType: "loader",
    originalFunction: LoaderFunction,
  ): LoaderFunction;
}

// Adapted from [Sentry](https://github.com/getsentry/sentry-javascript/blob/540adac9ec81803f86a3a7f5b34ebbc1ad2a8d23/packages/remix/src/utils/instrumentServer.ts#L172-L210)
const makeWrappedDataFunction: MakeWrappedDataFunction = (
  hub: Hub,
  id: string,
  dataFunctionType,
  originalFunction,
) => {
  return async function (
    this: unknown,
    args: Parameters<typeof originalFunction>[0],
  ): Promise<Response | AppData> {
    const activeTransaction = hub.getScope().getTransaction();

    const span = activeTransaction?.startChild({
      op: `function.remix.${dataFunctionType}`,
      description: id,
      tags: {
        name: dataFunctionType,
      },
    });

    if (span) {
      // Assign data function to hub to be able to see `db` transactions (if any) as children.
      hub.getScope().setSpan(span);
    }

    const response = (await originalFunction.call(this, args)) as unknown;

    hub.getScope().setSpan(activeTransaction);
    span?.finish();

    return response;
  };
};

const makeWrappedAction =
  (hub: Hub, id: string) =>
  (origAction: ActionFunction): ActionFunction => {
    return makeWrappedDataFunction(hub, id, "action", origAction);
  };

const makeWrappedLoader =
  (hub: Hub, id: string) =>
  (origLoader: LoaderFunction): LoaderFunction => {
    return makeWrappedDataFunction(hub, id, "loader", origLoader);
  };

// Adapted from [Sentry](https://github.com/getsentry/sentry-javascript/blob/540adac9ec81803f86a3a7f5b34ebbc1ad2a8d23/packages/remix/src/utils/instrumentServer.ts#L246-L283)
const makeWrappedRootLoader =
  (hub: Hub) =>
  (origLoader: LoaderFunction): LoaderFunction => {
    return async function (
      this: unknown,
      args: LoaderArgs,
    ): Promise<Response | AppData> {
      const response: object = (await origLoader.call(
        this,
        args,
      )) as unknown as object;
      const scope = hub.getScope();
      const sentryHeaders = {
        "sentry-trace": scope.getSpan()?.toTraceparent(),
        baggage: dynamicSamplingContextToSentryBaggageHeader(
          scope.getTransaction()?.getDynamicSamplingContext(),
        ),
      };

      // Note: `redirect` and `catch` responses do not have bodies to extract
      if (
        isResponse(response) &&
        !isRedirectResponse(response) &&
        !isCatchResponse(response)
      ) {
        // The original Sentry implementation `.clone()`s the response body in order to check if it's an object, which is really wasteful. Since I know my root loaders are going to return objects, I can just assert it and save time.
        return json(
          {
            ...(await response.json<{ [key: string]: unknown }>()),
            sentryHeaders,
          },
          {
            headers: response.headers,
            statusText: response.statusText,
            status: response.status,
          },
        );
      }

      return { ...response, sentryHeaders };
    };
  };

/**
 * Instruments `remix` ServerBuild for performance tracing.
 *
 * Adapted from [Sentry](https://github.com/getsentry/sentry-javascript/blob/540adac9ec81803f86a3a7f5b34ebbc1ad2a8d23/packages/remix/src/utils/instrumentServer.ts#L409-L451).
 */
export const instrumentBuild = (hub: Hub, build: ServerBuild): ServerBuild => {
  const routes: ServerBuild["routes"] = {};

  const wrappedEntry = { ...build.entry, module: { ...build.entry.module } };

  // Not keeping boolean flags like it's done for `requestHandler` functions,
  // Because the build can change between build and runtime.
  // So if there is a new `loader` or`action` or `documentRequest` after build.
  // We should be able to wrap them, as they may not be wrapped before.
  if (!(wrappedEntry.module.default as WrappedFunction).__sentry_original__) {
    fill(
      wrappedEntry.module,
      "default",
      makeWrappedDocumentRequestFunction(hub),
    );
  }

  for (const [id, route] of Object.entries(build.routes)) {
    const wrappedRoute = { ...route, module: { ...route.module } };

    if (
      wrappedRoute.module.action &&
      !(wrappedRoute.module.action as WrappedFunction).__sentry_original__
    ) {
      fill(wrappedRoute.module, "action", makeWrappedAction(hub, id));
    }

    if (
      wrappedRoute.module.loader &&
      !(wrappedRoute.module.loader as WrappedFunction).__sentry_original__
    ) {
      fill(wrappedRoute.module, "loader", makeWrappedLoader(hub, id));
    }

    // Entry module should have a loader function to provide `sentry-trace` and `baggage`
    // They will be available for the root `meta` function as `data.sentry.trace` and `data.sentry.baggage`
    if (wrappedRoute.parentId === undefined) {
      if (!wrappedRoute.module.loader) {
        wrappedRoute.module.loader = () => ({});
      }

      // We want to wrap the root loader regardless of whether it's already wrapped before.
      fill(wrappedRoute.module, "loader", makeWrappedRootLoader(hub));
    }

    routes[id] = wrappedRoute;
  }

  return { ...build, routes, entry: wrappedEntry };
};
