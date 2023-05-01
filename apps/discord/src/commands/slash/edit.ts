import { AutocompleteContext, CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create';
import { editModalStructure } from '../../components/editModal';
import { server } from '../../shim';

export default class BotCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'edit',
      description: 'Edits a giveaway',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'id',
          description: 'ID of the giveaway to edit',
          required: true,
          autocomplete: true
        }
      ]
    });
  }

  async autocomplete(ctx: AutocompleteContext) {
    const id = ctx.options.id;
    const giveaway = await server
      .db!.selectFrom('giveaways')
      .selectAll()
      .where('guild_id', '=', ctx.guildID!)
      .where('end_time', '>', new Date().toISOString())
      .where('message_id', 'like', `${id}%`)
      .orderBy('end_time', 'asc')
      .limit(10)
      .execute();
    console.log(giveaway);
    if (giveaway.length === 0) return ctx.sendResults([]);
    return ctx.sendResults(
      giveaway.map((giveaway) => ({
        name: `${giveaway.prize}`,
        value: `${giveaway.message_id}`
      }))
    );
  }

  async run(ctx: CommandContext) {
    console.log(ctx.options);
    const id = await server.env!.KV.get(ctx.options.id);
    if (!id)
      return ctx.send('That message is not a giveaway, or it has expired.', {
        ephemeral: true
      });
    const state = server.states!.get(server.env!.GIVEAWAY_STATE.idFromString(id));

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
        description: data.description || ''
      }),
      async (data) => {
        const prize = data.values.prize;
        const winners = data.values.winners;
        const description = data.values.description;

        if (isNaN(+winners))
          return data.send('Winners must be a number.', {
            ephemeral: true
          });

        state.class.setup({
          prize: prize,
          winners: Number(winners)
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
