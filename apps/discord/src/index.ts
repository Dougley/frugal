/// <reference types="../worker-configuration.d.ts" />

import { drizzleD1 } from "@dougley/frugal-drizzle/workers";
import { createI18n } from "@dougley/frugal-i18n";
import {
  createProxy,
  handleAlarm,
  stateRouter,
} from "@dougley/frugal-savestate";
import * as Sentry from "@sentry/cloudflare";
import { CloudflareWorkerServer } from "slash-create/web";
import { SlashCreator } from "./classes/SlashCreator";
import { commands, componentHandlers, modalHandlers } from "./commands";
import { runWithContext } from "./context";

export const GiveawayStateV3 = Sentry.instrumentDurableObjectWithSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    release: env.CF_VERSION_METADATA.id,
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
    enableLogs: true,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
    ],
  }),
  // @ts-expect-error - The way we're using the state router is not typed
  createProxy(stateRouter, handleAlarm)
);

// Using CloudflareWorkerServer from slash-create/web
const cfServer = new CloudflareWorkerServer();
let creator: SlashCreator;

// Create the SlashCreator instance with env variables
function makeCreator(env: Env) {
  creator = new SlashCreator({
    applicationID: env.DISCORD_APP_ID,
    publicKey: env.DISCORD_PUBLIC_KEY,
    token: env.DISCORD_BOT_TOKEN,
  });

  creator.withServer(cfServer).registerCommands(commands);

  // Register component handlers for buttons using regex patterns
  Object.entries(componentHandlers).forEach(([_, handler]) => {
    if (handler.pattern) {
      creator.addRegexComponentHandler(handler.pattern, handler.handler);
    }
    if (handler.custom_id) {
      creator.registerGlobalComponent(handler.custom_id, handler.handler);
    }
  });

  // Register modal handlers using regex patterns
  Object.entries(modalHandlers).forEach(([_, handler]) => {
    if (handler.pattern) {
      creator.addRegexModalHandler(handler.pattern, handler.handler);
    }
    if (handler.custom_id) {
      creator.registerGlobalModal(handler.custom_id, handler.handler);
    }
  });

  // Set up event handlers
  creator.on("warn", (message) => console.warn(message));
  creator.on("error", (error) =>
    console.error(error.stack || error.toString())
  );
  creator.on("commandRun", (command, _, ctx) =>
    console.info(
      `${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`
    )
  );
  creator.on("commandError", (command, error) => {
    console.error(
      `Command ${command.commandName} errored:`,
      error.stack || error.toString()
    );
  });
  creator.on("componentInteraction", (ctx) =>
    console.info(
      `${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) triggered component interaction ${ctx.customID}`
    )
  );
}

export default Sentry.withSentry(
  (env) => {
    const { id: versionId } = env.CF_VERSION_METADATA;
    return {
      dsn: env.SENTRY_DSN,
      release: versionId,
      tracesSampleRate: 1.0,
      sendDefaultPii: true,
      enableLogs: true,
      integrations: [
        Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
      ],
    };
  },
  {
    async fetch(
      request: Request,
      env,
      ctx: ExecutionContext
    ): Promise<Response> {
      // Create context for this request
      const context = {
        env,
        // HACK: sentry wrapped durables change the signature of the class
        state: GiveawayStateV3 as unknown as ReturnType<typeof createProxy>,
        drizzle: drizzleD1(env.D1),
        i18n: createI18n({
          kv: env.KV_LOCALES,
          defaultLanguage: "en-pirate",
        }),
      };

      Sentry.instrumentD1WithSentry(env.D1);

      // Initialize the creator if it doesn't exist
      if (!creator) makeCreator(env);

      // Run request within context
      return runWithContext(context, async () => {
        return cfServer.fetch(request, env, ctx);
      });
    },
  } satisfies ExportedHandler<Cloudflare.Env>
);
