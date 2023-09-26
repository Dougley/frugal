import type { HandleErrorFunction } from "@remix-run/server-runtime";
import { type DataFunctionArgs } from "@remix-run/server-runtime";
import { AppLoadContext } from "@sentry/remix/types/utils/vendor/types";
import { type Hub } from "@sentry/types";
import { captureRemixServerException } from "./serverCapture";

export const handleError: HandleErrorFunction = async (
  error: unknown,
  {
    request,
    context: { sentry },
  }: DataFunctionArgs & { context: AppLoadContext & { sentry: Hub } },
) => {
  if (error instanceof Error) {
    await captureRemixServerException(sentry, error, "remix.server", request);
  } else {
    sentry.captureException(error);
  }
};
