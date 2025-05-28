import { drizzleD1 } from '@dougley/frugal-drizzle/workers';
import { createProxy, type DurableObjectProxy, handleAlarm, stateRouter } from '@dougley/frugal-savestate';
import * as Sentry from '@sentry/cloudflare';
import { CloudflareWorkerServer } from 'slash-create/web';
import { SlashCreator } from './classes/SlashCreator';
import { commands, componentHandlers, modalHandlers } from './commands';
import { EnvContext } from './env';

const GiveawayStateV3Class: DurableObjectProxy = createProxy(stateRouter, handleAlarm);
export { GiveawayStateV3Class as GiveawayStateV3 }; // Durable Object

// Using CloudflareWorkerServer from slash-create/web
const cfServer = new CloudflareWorkerServer();
let creator: SlashCreator;

// Create the SlashCreator instance with env variables
function makeCreator(env: LegacyEnv) {
  creator = new SlashCreator({
    applicationID: env.DISCORD_APP_ID,
    publicKey: env.DISCORD_PUBLIC_KEY,
    token: env.DISCORD_BOT_TOKEN
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
  creator.on('warn', (message) => console.warn(message));
  creator.on('error', (error) => console.error(error.stack || error.toString()));
  creator.on('commandRun', (command, _, ctx) =>
    console.info(`${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`)
  );
  creator.on('commandError', (command, error) => {
    console.error(`Command ${command.commandName} errored:`, error.stack || error.toString());
  });
  creator.on('componentInteraction', (ctx) =>
    console.info(
      `${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) triggered component interaction ${ctx.customID}`
    )
  );
}

export default Sentry.withSentry(
  (env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0
  }),
  {
    async fetch(request: Request, env: LegacyEnv, ctx: ExecutionContext): Promise<Response> {
      // Set the environment context
      EnvContext.env = env;
      EnvContext.state = createProxy(stateRouter, handleAlarm);
      EnvContext.drizzle = drizzleD1(env.D1);

      Sentry.instrumentD1WithSentry(env.D1);

      // Initialize the creator if it doesn't exist
      if (!creator) makeCreator(env);

      // Use the CloudflareWorkerServer to handle the request
      return cfServer.fetch(request, env, ctx);
    }
  } satisfies ExportedHandler<LegacyEnv>
);
