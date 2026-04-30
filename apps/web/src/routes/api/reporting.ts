import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Sentry tunnel/reporting endpoint
 *
 * This proxies Sentry envelope requests to bypass ad blockers that may
 * block direct requests to sentry.io. It validates the DSN and project
 * ID to prevent abuse.
 *
 * @see https://docs.sentry.io/platforms/javascript/troubleshooting/#using-the-tunnel-option
 */
export const Route = createFileRoute("/api/reporting")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!env.SENTRY_DSN) {
            return new Response("Sentry DSN not configured", { status: 500 });
          }

          const SENTRY_DSN = env.SENTRY_DSN;
          const parts = new URL(SENTRY_DSN);

          const SENTRY_HOST = parts.hostname;
          const SENTRY_PROJECT_IDS = parts.pathname.split("/");

          const envelopeBytes = await request.arrayBuffer();
          const envelope = new TextDecoder().decode(envelopeBytes);
          const piece = envelope.split("\n")[0];
          const header = JSON.parse(piece);
          const dsn = new URL(header.dsn);
          const projectId = dsn.pathname?.replace("/", "");

          if (dsn.hostname !== SENTRY_HOST) {
            console.error(`Invalid sentry hostname: ${dsn.hostname}`);
            return new Response("Invalid request", { status: 400 });
          }

          if (!projectId || !SENTRY_PROJECT_IDS.includes(projectId)) {
            console.error(`Invalid sentry project id: ${projectId}`);
            return new Response("Invalid request", { status: 400 });
          }

          const upstream = new URL(
            `https://${SENTRY_HOST}/api/${projectId}/envelope/`
          );

          await fetch(upstream, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-sentry-envelope",
              "X-Sentry-Auth": header.header,
            },
            body: envelopeBytes,
          });

          return new Response(JSON.stringify({ status: 200 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Sentry tunnel error:", error);
          return new Response("Error", { status: 500 });
        }
      },
    },
  },
});
