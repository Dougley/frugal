import { ButtonStyle, ComponentContext, ComponentType } from 'slash-create';
import { server } from '../shim';

export async function joinButtonRegistryCallback(ctx: ComponentContext) {
  const data = await server
    .db!.selectFrom('giveaways')
    .selectAll()
    .where('message_id', '=', ctx.message.id)
    .executeTakeFirst();
  if (!data || new Date(data.end_time) < new Date()) {
    return ctx.send({
      content: `This giveaway has expired, you can't enter it.`,
      ephemeral: true
    });
  }
  const entered = await server
    .db!.selectFrom('entries')
    .select(['user_id'])
    .where('giveaway_id', '=', ctx.message.id)
    .where('user_id', '=', ctx.user.id)
    .executeTakeFirst();
  if (entered) {
    return ctx.send({
      content: `You have already entered this giveaway. Do you want to leave instead?`,
      ephemeral: true,
      components: [
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.DESTRUCTIVE,
              label: 'Leave',
              custom_id: `leaveButton`,
              emoji: {
                name: '👋'
              }
            }
          ]
        }
      ]
    });
  } else {
    await server
      .db!.insertInto('entries')
      .values({
        giveaway_id: ctx.message.id,
        user_id: ctx.user.id,
        username: ctx.user.username,
        discriminator: ctx.user.discriminator,
        avatar: ctx.user.avatar ?? null
      })
      .execute();
    return ctx.send({
      content: `You entered the giveaway!`,
      ephemeral: true
    });
  }
}

export async function leaveButtonRegistryCallback(ctx: ComponentContext) {
  const data = await server
    .db!.selectFrom('giveaways')
    .selectAll()
    .where('message_id', '=', ctx.message.id)
    .executeTakeFirst();
  if (!data || new Date(data.end_time) < new Date()) {
    return ctx.editParent({
      content: `This giveaway has expired.`,
      components: []
    });
  }
  await server
    .db!.deleteFrom('entries')
    .where('giveaway_id', '=', ctx.message.id)
    .where('user_id', '=', ctx.user.id)
    .execute();
  return ctx.editParent({
    content: `You left the giveaway!`,
    components: []
  });
}
