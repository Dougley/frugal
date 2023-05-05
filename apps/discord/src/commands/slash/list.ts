import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import { server } from '../../shim';

export default class BotCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'list',
      description: 'Lists all giveaways in the server'
    });
  }

  async run(ctx: CommandContext) {
    const giveaways = await server
      .db!.selectFrom('giveaways')
      .select(['prize', 'end_time', 'winners'])
      .where('guild_id', '=', ctx.guildID!)
      .where('end_time', '>', new Date().toISOString())
      .orderBy('end_time', 'asc')
      .execute();
    if (giveaways.length === 0) return ctx.send('There are no giveaways in this server.');
    const description = giveaways.map((giveaway) => {
      const winners = giveaway.winners === 1 ? '1 winner' : `${giveaway.winners} winners`;
      return `**${giveaway.prize}** - ${winners} - Ends <t:${Math.floor(
        new Date(giveaway.end_time).getTime() / 1000
      )}:R> (<t:${Math.floor(new Date(giveaway.end_time).getTime() / 1000)}:F>)`;
    });
    return ctx.send({
      embeds: [
        {
          title: 'Giveaways',
          description: description.join('\n')
        }
      ]
    });
  }
}
