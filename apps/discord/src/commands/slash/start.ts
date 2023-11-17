import {
  ButtonStyle,
  CommandContext,
  CommandOptionType,
  ComponentType,
  SlashCommand,
  SlashCreator
} from 'slash-create/web';
import { joinButtonRegistryCallback, leaveButtonRegistryCallback } from '../../components/buttons';
import { EnvContext as server } from '../../index';
import { parseTime } from '../../utils/time';

export default class BotCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'start',
      description: 'Starts a giveaway in the current channel',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'duration',
          description: 'Duration of the giveaway',
          required: true
        },
        {
          type: CommandOptionType.INTEGER,
          name: 'winners',
          description: 'Number of winners',
          required: true,
          min_value: 1,
          max_value: 50
        },
        {
          type: CommandOptionType.STRING,
          name: 'prize',
          description: 'Prize to win',
          required: true,
          min_length: 1,
          max_length: 100
        },
        {
          type: CommandOptionType.STRING,
          name: 'description',
          description: 'Description of the giveaway',
          required: false,
          min_length: 1,
          max_length: 1000
        },
        {
          type: CommandOptionType.ATTACHMENT,
          name: 'image',
          description: 'Image to display in the giveaway',
          required: false
        }
      ]
    });
    creator.registerGlobalComponent('joinButton', joinButtonRegistryCallback);
    creator.registerGlobalComponent('leaveButton', leaveButtonRegistryCallback);
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const duration = parseTime(ctx.options.duration);
    if (duration === 0) {
      return ctx.sendFollowUp({
        content: 'Invalid duration',
        ephemeral: true
      });
    }
    // a giveaway can't be longer than 14 days
    if (duration > 14 * 24 * 60 * 60 * 1000) {
      return ctx.sendFollowUp({
        content: "Giveaways can't be longer than 14 days",
        ephemeral: true
      });
    }
    // at minimum, a giveaway must be 10 seconds long
    if (duration < 10 * 1000) {
      return ctx.sendFollowUp({
        content: "Giveaways can't be shorter than 10 seconds",
        ephemeral: true
      });
    }
    const endDate = new Date(Date.now() + duration);
    const timestamp = (endDate.getTime() / 1000).toFixed(0);
    const msg = await ctx.sendFollowUp({
      content: 'Giveaway!',
      embeds: [
        {
          color: 0x00ff00,
          title: ctx.options.prize,
          description: ctx.options.description ?? undefined,
          fields: [
            {
              name: 'Winners',
              value: ctx.options.winners.toString(),
              inline: true
            },
            {
              name: 'Ends',
              value: `<t:${timestamp}:R> (<t:${timestamp}:F>)`,
              inline: true
            }
          ],
          timestamp: endDate.toISOString(),
          image: ctx.options.image ? { url: ctx.attachments.get(ctx.options.image)!.url } : undefined
        }
      ],
      components: [
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.PRIMARY,
              label: 'Enter!',
              custom_id: `joinButton`,
              emoji: {
                name: '🎉'
              }
            }
          ]
        }
      ]
    });
    const id = server.states!.newUniqueId();
    const stub = server.states!.get(id);
    await stub.setGiveawayId(msg.id);
    await server
      .db!.insertInto('giveaways')
      .values({
        message_id: msg.id,
        guild_id: ctx.guildID!,
        channel_id: ctx.channelID!,
        end_time: endDate.toISOString(),
        host_id: ctx.user.id,
        prize: ctx.options.prize,
        winners: ctx.options.winners,
        durable_object_id: id.toString()
      })
      .execute();
    await stub.startAlarm(endDate.toUTCString());
  }
}
