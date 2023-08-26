import { isRouteErrorResponse } from "@remix-run/react";
import * as Sentry from "@sentry/remix";
import { addExceptionMechanism, isString } from "@sentry/utils";
import { useContext } from "react";
import { SentrySSRContext } from "./SSRContext";

declare const document: unknown;

// Adapted from [Sentry](https://github.com/getsentry/sentry-javascript/blob/540adac9ec81803f86a3a7f5b34ebbc1ad2a8d23/packages/remix/src/client/errors.tsx#L18-L65)
export const captureRemixErrorBoundaryError = (error: unknown) => {
  const sentrySSR = useContext(SentrySSRContext);
  const sentry =
    typeof document === "undefined" ? sentrySSR : Sentry.getCurrentHub();

  if (sentry === undefined) {
    throw new Error(
      "Sentry wasn't correctly initialized. Error reports will not be delivered.",
    );
  }

  const isClientSideRuntimeError =
    typeof document !== "undefined" && error instanceof Error;
  const isRemixErrorResponse = isRouteErrorResponse(error);

  // Server-side errors apart from `ErrorResponse`s also appear here without their stacktraces.
  // So, we only capture:
  //    1. `ErrorResponse`s
  //    2. Client-side runtime errors here,
  //    And other server - side errors in `handleError` function where stacktraces are available.
  if (isRemixErrorResponse || isClientSideRuntimeError) {
    const eventData = isRemixErrorResponse
      ? {
          function: "ErrorResponse",
          ...(error.data as { [key: string]: unknown }),
        }
      : {
          function: "ReactError",
        };

    sentry.withScope((scope) => {
      scope.addEventProcessor((event) => {
        addExceptionMechanism(event, {
          type: "instrument",
          handled: true,
          data: eventData,
        });
        return event;
      });

      if (isRemixErrorResponse) {
        if (isString(error.data)) {
          sentry.captureException(error.data);
        } else if (error.statusText) {
          sentry.captureException(error.statusText);
        } else {
          sentry.captureException(error);
        }
      } else {
        sentry.captureException(error);
      }
    });
  }
};
