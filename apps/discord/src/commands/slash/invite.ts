import { CommandContext, SlashCommand, SlashCreator } from 'slash-create/web';

export default class BotCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'invite',
      description: 'Invite the bot to your server'
    });
  }

  async run(ctx: CommandContext) {
    const inviteMsg = [
      `You can invite the bot to your server by clicking [here](https://discord.com/oauth2/authorize?client_id=${DISCORD_APP_ID}&scope=bot%20applications.commands).`,
      '\n\n',
      `Join the support server [here](https://discord.gg/giveawaybot) for help, or to report bugs.`
    ];

    return ctx.send({
      // this will only work if the app is in applcation discovery, but we'll just assume it is ;)
      content: `https://discord.com/application-directory/${DISCORD_APP_ID}`,
      embeds: [
        {
          description: inviteMsg.join(''),
          color: 0x00ff00
        }
      ]
    });
  }
}
