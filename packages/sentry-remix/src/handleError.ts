import { type DataFunctionArgs } from "@remix-run/server-runtime";
import { type Hub } from "@sentry/types";
import { captureRemixServerException } from "./serverCapture";

export const handleError = async (
  error: unknown,
  { request, context: { sentry } }: DataFunctionArgs & { context: { sentry: Hub } }
) => {
  if (error instanceof Error) {
    await captureRemixServerException(sentry, error, "remix.server", request);
  } else {
    sentry.captureException(error);
  }
};