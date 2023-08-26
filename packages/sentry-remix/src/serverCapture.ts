import { isResponse } from "@remix-run/server-runtime/dist/responses";
import { type Hub } from "@sentry/types";
import { addExceptionMechanism } from "@sentry/utils";

const extractData = async (response: Response) => {
  const contentType = response.headers.get("Content-Type");

  // Cloning the response to avoid consuming the original body stream
  const responseClone = response.clone();

  if (contentType !== null && /\bapplication\/json\b/u.test(contentType)) {
    return await responseClone.json();
  }

  return await responseClone.text();
};

const extractResponseError = async (response: Response) => {
  const responseData = await extractData(response);

  if (typeof responseData === "string") {
    return responseData;
  }

  if (response.statusText) {
    return response.statusText;
  }

  return responseData;
};

// Adapted from [Sentry](https://github.com/getsentry/sentry-javascript/blob/540adac9ec81803f86a3a7f5b34ebbc1ad2a8d23/packages/remix/src/utils/instrumentServer.ts#L63C1-L118)
export const captureRemixServerException = async (
  hub: Hub,
  error: unknown,
  name: string,
  request: Request
): Promise<void> => {
  // Skip capturing if the thrown error is not a 5xx response
  // https://remix.run/docs/en/v1/api/conventions#throwing-responses-in-loaders
  if (isResponse(error) && error.status < 500) {
    return;
  }

  const scope = hub.getScope();
  const activeTransactionName = scope.getTransaction()?.name;

  scope.setSDKProcessingMetadata({
    request: {
      ...request,
      // When `route` is not defined, `RequestData` integration uses the full URL
      route:
        activeTransactionName !== undefined
          ? {
              path: activeTransactionName,
            }
          : undefined,
    },
  });

  scope.addEventProcessor((event) => {
    addExceptionMechanism(event, {
      type: "instrument",
      handled: true,
      data: {
        function: name,
      },
    });

    return event;
  });

  const normalizedError = isResponse(error) ? await extractResponseError(error) : error;

  // eslint-disable-next-line no-console -- This is fine, errors will end up in the Cloudflare logs which should be helpful at the end of the day.
  console.error(normalizedError);

  hub.captureException(normalizedError);
};