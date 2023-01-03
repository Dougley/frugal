import { Transaction as SentryTX } from "@sentry/integrations";
import * as SentryTRC from "@sentry/tracing";
import { SpanContext } from "@sentry/types";
import { APIInteraction } from "discord-api-types/v9";
import { Toucan } from "toucan-js";
import { Context } from "toucan-js/dist/types";

export function getTX() {
  const toucan = getToucan();
  return toucan.getScope()?.getTransaction();
}

export function createChildTX(
  opts:
    | Pick<
        SpanContext,
        | "description"
        | "op"
        | "status"
        | "spanId"
        | "tags"
        | "data"
        | "startTimestamp"
        | "endTimestamp"
        | "instrumenter"
      >
    | undefined
) {
  const span = getTX()?.startChild(opts);
  return span;
}

export function interactionTX(
  name: string,
  interaction: Partial<{
    type: APIInteraction["type"];
    channel_id: APIInteraction["channel_id"];
    guild_id: APIInteraction["guild_id"];
    member: APIInteraction["member"];
    version: APIInteraction["version"];
  }>
) {
  const span = createChildTX({
    op: `interaction:${interaction.type}.${name}`,
    data: {
      channel: interaction.channel_id,
      guild: interaction.guild_id,
      user: interaction.member?.user.id,
      type: interaction.type,
      version: interaction.version,
    },
  });
  return span;
}

let _toucan: Toucan;
export function getToucan(context?: Context, request?: Request, env?: Env) {
  if (_toucan) return _toucan;
  _toucan = new Toucan({
    dsn: SENTRY_DSN, // Replaced by esbuild when bundling, see scripts/build.js (do not edit)
    context,
    request,
    environment: env?.DEV ? "development" : env?.ENVIROMENT ?? "production",
    integrations: [
      // new RewriteFrames({
      //   //root: "/",
      //   // iteratee: (frame) => ({
      //   //   ...frame,
      //   //   filename: "/index.mjs",
      //   //   abs_path: "~/index.mjs",
      //   // }),
      // }),
      new SentryTX(),
      // @ts-expect-error - type version mismatch
      new SentryTRC.Integrations.BrowserTracing(),
    ],
    tracesSampleRate: 1,
  });
  return _toucan;
}
