import { RESTPutAPIApplicationCommandsResult, RouteBases, Routes } from 'discord-api-types/v10';
import * as Commands from '../src/commands';

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const APP_ID = process.env.DISCORD_APP_ID;
const DEV_GUILD = process.env.DEVELOPMENT_GUILD;

if (!DISCORD_TOKEN) {
  throw new Error('DISCORD_BOT_TOKEN environment variable is required');
}

if (!APP_ID) {
  throw new Error('DISCORD_APP_ID environment variable is required');
}

async function registerCommands() {
  const commands = Object.values(Commands).map((Command) => new Command().builder.toJSON());

  try {
    console.log('Started refreshing application commands...');
    if (DEV_GUILD) {
      console.log(`Registering commands in development guild: ${DEV_GUILD}`);
    }

    const endpoint = DEV_GUILD
      ? Routes.applicationGuildCommands(APP_ID!, DEV_GUILD)
      : Routes.applicationCommands(APP_ID!);

    const response = await fetch(RouteBases.api + endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
        'User-Agent': 'DiscordBot (@giveawaybot/cmd-register, v1; +https://github.com/dougley/frugal)',
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify(commands)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to register commands: ${JSON.stringify(error, null, 2)}`);
    }

    console.log('Successfully registered application commands.');
    const data = (await response.json()) as RESTPutAPIApplicationCommandsResult;
    console.log(`Registered ${data.length} commands:`);
    data.forEach((cmd) => {
      console.log(`- ${cmd.name}`);
    });
  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
}

registerCommands();
