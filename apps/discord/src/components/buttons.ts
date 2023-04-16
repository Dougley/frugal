import { GiveawayState } from '@dougley/frugal-giveaways-do';
import { ButtonStyle, ComponentContext, ComponentType } from 'slash-create';
import { server } from '../shim';

export async function joinButtonRegistryCallback(ctx: ComponentContext) {
  const stub = GiveawayState.wrap(server.env!.GIVEAWAY_STATE);
  const durableID = await server.env!.KV.get(ctx.message.id);
  if (!durableID) {
    return ctx.send({
      content: `This giveaway has expired.`,
      ephemeral: true
    });
  }
  const id = server.env!.GIVEAWAY_STATE.idFromString(durableID);
  const state = stub.get(id);
  const alreadyEntered = await state.class.getEntry({ id: ctx.user.id });
  if (alreadyEntered) {
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
    await state.class.addEntry({
      id: ctx.user.id,
      username: ctx.user.username,
      discriminator: ctx.user.discriminator,
      avatar: ctx.user.avatar
    });
    return ctx.send({
      content: `You entered the giveaway!`,
      ephemeral: true
    });
  }
}

export async function leaveButtonRegistryCallback(ctx: ComponentContext) {
  const stub = GiveawayState.wrap(server.env!.GIVEAWAY_STATE);
  const durableID = await server.env!.KV.get(ctx.message.messageReference!.messageID!);
  if (!durableID) {
    return ctx.editParent({
      content: `This giveaway has expired.`,
      components: []
    });
  }
  const id = server.env!.GIVEAWAY_STATE.idFromString(durableID);
  const state = stub.get(id);
  await state.class.removeEntry({ id: ctx.user.id });
  return ctx.editParent({
    content: `You left the giveaway!`,
    components: []
  });
}
