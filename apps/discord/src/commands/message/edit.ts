import { ApplicationCommandType, CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import { editModalStructure } from '../../components/editModal';
import { server } from '../../shim';

export default class BotCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      type: ApplicationCommandType.MESSAGE,
      name: 'Edit Giveaway'
    });
  }

  async run(ctx: CommandContext) {
    const id = await server.env!.KV.get(ctx.targetMessage!.id);
    if (!id)
      return ctx.send('That message is not a giveaway, or it has expired.', {
        ephemeral: true
      });
    const data = await server
      .db!.selectFrom('giveaways')
      .select(['prize', 'winners', 'description'])
      .where('durable_object_id', '=', id)
      .executeTakeFirst();

    if (!data)
      return ctx.send('That message is not a giveaway, or it has expired.', {
        ephemeral: true
      });

    ctx.sendModal(
      editModalStructure({
        prize: data.prize,
        winners: `${data.winners}`,
        description: ctx.targetMessage!.embeds[0].description || ''
      }),
      async (data) => {
        const prize = data.values.prize;
        const winners = data.values.winners;
        const description = data.values.description;

        if (isNaN(+winners))
          return data.send('Winners must be a number.', {
            ephemeral: true
          });

        await server
          .db!.updateTable('giveaways')
          .set({
            prize: prize,
            winners: Number(winners)
          })
          .where('durable_object_id', '=', id)
          .execute();

        await ctx.edit(ctx.targetMessage!.id, {
          embeds: [
            ...ctx.targetMessage!.embeds.map((embed) => {
              // lots of non-null assertions here, but we know they exist because we're editing an existing giveaway
              embed.title = prize;
              embed.description = description;
              embed.fields!.find((field) => field.name === 'Winners')!.value = winners;
              return embed;
            })
          ]
        });
        return data.send('Giveaway edited successfully.', {
          ephemeral: true
        });
      }
    );
  }
}
