import { TRPCClientError } from '@dougley/frugal-savestate';
import { JoinButton as JoinButtonComponent } from '@dougley/frugal-utils';
import { ButtonStyle, ComponentContext, ComponentType } from 'slash-create/web';
import { EnvContext } from '../../env';

export default class JoinButton {
  // Re-export static properties from the component
  public static custom_id = JoinButtonComponent.custom_id;
  public static custom_id_regex = JoinButtonComponent.custom_id_regex;
  public static createButton = JoinButtonComponent.createButton;
  public static createActionRow = JoinButtonComponent.createActionRow;

  /**
   * Handles the button interaction when a user enters a giveaway
   * @param ctx The component context
   */
  public static async handleInteraction(ctx: ComponentContext) {
    // Extract the giveaway ID from the custom_id
    const [action, giveawayId] = ctx.customID.split(':');
    console.log('action:', action);
    console.log('giveawayId:', giveawayId);

    if (!giveawayId) {
      return await ctx.send({
        content: 'Invalid giveaway ID',
        ephemeral: true
      });
    }

    if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
      return await ctx.send({
        content: 'Giveaway state not available',
        ephemeral: true
      });
    }

    // Get giveaway instance
    const stub = EnvContext.state.getInstance(
      EnvContext.env.GIVEAWAY_STATE,
      EnvContext.env.GIVEAWAY_STATE.idFromString(giveawayId)
    );

    // Check if the giveaway exists and is still open
    const state = await stub.getState.query();
    console.log('Giveaway state:', state);

    if (!state) {
      return await ctx.send({
        content: 'Giveaway not found',
        ephemeral: true
      });
    }

    if (state.state !== 'OPEN') {
      return await ctx.send({
        content: 'Giveaway is not open',
        ephemeral: true
      });
    }

    // Check if the user has already joined
    try {
      if (action === 'giveaway_join') {
        const joinResponse = await stub.addEntry.mutate({
          user_id: ctx.user.id,
          username: ctx.user.username,
          avatar: ctx.user.avatar || null,
          discriminator: ctx.user.discriminator
        });
        return await ctx.send({
          content: `You have successfully entered the giveaway for **${state.prize}**!`,
          ephemeral: true
        });
      } else if (action === 'giveaway_leave') {
        const leaveResponse = await stub.removeEntry.mutate({
          user_id: ctx.user.id
        });
        return await ctx.send({
          content: `You have successfully left the giveaway for **${state.prize}**!`,
          ephemeral: true
        });
      }
    } catch (error) {
      if (error instanceof TRPCClientError) {
        switch (error.data.code) {
          case 'CONFLICT':
            return await ctx.send({
              content: 'You have already entered this giveaway. Leave instead?',
              ephemeral: true,
              components: [
                {
                  type: ComponentType.ACTION_ROW,
                  components: [
                    {
                      type: ComponentType.BUTTON,
                      style: ButtonStyle.DANGER,
                      label: 'Leave Giveaway',
                      custom_id: `giveaway_leave:${giveawayId}`
                    }
                  ]
                }
              ]
            });
          case 'NOT_FOUND':
            return await ctx.send({
              content: 'Either the giveaway does not exist or you already left it.',
              ephemeral: true
            });
          case 'PRECONDITION_FAILED':
            return await ctx.send({
              content: 'Giveaway has already ended',
              ephemeral: true
            });
          case 'TOO_MANY_REQUESTS':
            return await ctx.send({
              content: 'You are being rate limited. Please try again later.',
              ephemeral: true
            });
          default:
            console.error('Unexpected error:', error);
            return await ctx.send({
              content: 'An unexpected error occurred while joining the giveaway.',
              ephemeral: true
            });
        }
      } else {
        console.error('Unexpected error:', error);
        return await ctx.send({
          content: 'An unexpected error occurred while joining the giveaway.',
          ephemeral: true
        });
      }
    }
  }
}
