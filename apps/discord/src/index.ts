import type { Request } from '@cloudflare/workers-types';
import { Database } from '@dougley/d1-database';
import { v2 } from '@dougley/frugal-giveaways-do';
import { HyperNamespaceProxy, proxyHyperDurables } from '@ticketbridge/hyper-durable';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { CloudflareWorkerServer, SlashCreator } from 'slash-create/web';
import { commands } from './commands/index.js';

export const EnvContext = {
  env: null as Env | null,
  db: null as Kysely<Database> | null,
  states: null as HyperNamespaceProxy<v2.GiveawayStateV2, Env> | null
};

export const creator = new SlashCreator({
  applicationID: DISCORD_APP_ID,
  publicKey: DISCORD_PUBLIC_KEY,
  token: DISCORD_BOT_TOKEN
});

const server = new CloudflareWorkerServer();
creator.withServer(server).registerCommands(commands);

creator.on('warn', (message) => console.warn(message));
creator.on('error', (error) => console.error(error.stack || error.toString()));
creator.on('commandRun', (command, _, ctx) =>
  console.info(`${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`)
);
creator.on('commandError', (command, error) => {
  if (error.cause) console.error(error.cause);
  console.error(`Command ${command.commandName} errored:`, error.stack || error.toString());
});

// DO bindings
export { GiveawayState } from '@dougley/frugal-giveaways-do';
export { GiveawayStateV2 } from '@dougley/frugal-giveaways-do/v2';

export default {
  fetch: async (request: Request, env, ctx) => {
    EnvContext.env = env;
    EnvContext.db = new Kysely<Database>({
      dialect: new D1Dialect({ database: env.D1 })
    });
    EnvContext.states = proxyHyperDurables(env, {
      GIVEAWAY_STATE: v2.GiveawayStateV2
    }).GIVEAWAY_STATE;
    return await server.fetch(request, env, ctx);
  }
} as ExportedHandler<Env>;
