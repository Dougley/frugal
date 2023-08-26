import { type Hub, type TransactionSource } from "@sentry/types";
import { tracingContextFromHeaders } from "@sentry/utils";

/**
 * Starts a new transaction for the given request to be used by different `RequestHandler` wrappers.
 *
 * Adapted from [Sentry](https://github.com/getsentry/sentry-javascript/blob/540adac9ec81803f86a3a7f5b34ebbc1ad2a8d23/packages/remix/src/utils/instrumentServer.ts#L300-L340)
 */
export const startRequestHandlerTransaction = (
  hub: Hub,
  request: Request,
  name: string,
  source: TransactionSource,
  data?: { [key: string]: string | undefined },
) => {
  const { traceparentData, dynamicSamplingContext, propagationContext } =
    tracingContextFromHeaders(
      request.headers.get("sentry-trace") ?? undefined,
      request.headers.get("baggage"),
    );
  hub.getScope().setPropagationContext(propagationContext);

  const transaction = hub.startTransaction({
    name,
    op: "http.server",
    tags: {
      method: request.method,
    },
    data,
    ...traceparentData,
    metadata: {
      source,
      dynamicSamplingContext:
        traceparentData && !dynamicSamplingContext
          ? {}
          : dynamicSamplingContext,
    },
  });

  hub.getScope().setSpan(transaction);
  return transaction;
};
