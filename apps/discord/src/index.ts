import { commands } from './commands/index.js';
import { SlashCreator, server } from './shim';
import { GiveawayState } from '@dougley/frugal-giveaways-do';

export const creator = new SlashCreator({
  applicationID: DISCORD_APP_ID,
  publicKey: DISCORD_PUBLIC_KEY,
  token: DISCORD_BOT_TOKEN
});

creator.withServer(server).registerCommands(commands);

creator.on('warn', (message) => console.warn(message));
creator.on('error', (error) => console.error(error.stack || error.toString()));
creator.on('commandRun', (command, _, ctx) =>
  console.info(`${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`)
);
creator.on('commandError', (command, error) =>
  console.error(`Command ${command.commandName} errored:`, error.stack || error.toString())
);

// DO bindings
export { GiveawayState };

export default server.moduleWorkerBindings;
