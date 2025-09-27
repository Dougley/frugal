import { TRPCClientError } from "@dougley/frugal-savestate";
import { JoinButton } from "@dougley/frugal-utils";
import {
  ButtonStyle,
  type ComponentContext,
  ComponentType,
} from "slash-create/web";
import { getContext } from "../../context";

// Export patterns for commands/index.ts
export const custom_id_regex = JoinButton.custom_id_regex;

/**
 * Handles the button interaction when a user enters a giveaway
 * @param ctx The component context
 */
export async function handleInteraction(ctx: ComponentContext) {
  // Extract the giveaway ID from the custom_id
  const [action, giveawayId] = ctx.customID.split(":");
  console.log("action:", action);
  console.log("giveawayId:", giveawayId);

  if (!giveawayId) {
    return await ctx.send({
      content: await getContext().i18n.translate(
        "components.join_button.errors.invalid_giveaway_id",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  }

  if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
    return await ctx.send({
      content: await getContext().i18n.translate(
        "components.join_button.errors.giveaway_state_unavailable",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  }

  // Get giveaway instance
  const stub = getContext().state.getInstance(
    getContext().env.GIVEAWAY_STATE,
    getContext().env.GIVEAWAY_STATE.idFromString(giveawayId)
  );

  // Check if the giveaway exists and is still open
  const state = await stub.getState.query();
  console.log("Giveaway state:", state);

  if (!state) {
    return await ctx.send({
      content: await getContext().i18n.translate(
        "components.join_button.errors.giveaway_not_found",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  }

  if (state.state !== "OPEN") {
    return await ctx.send({
      content: await getContext().i18n.translate(
        "components.join_button.errors.giveaway_not_open",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  }

  // Check if the user has already joined
  try {
    if (action === "giveaway_join") {
      await stub.addEntry.mutate({
        user_id: ctx.user.id,
        username: ctx.user.username,
        avatar: ctx.user.avatar || null,
        discriminator: ctx.user.discriminator,
      });
      return await ctx.send({
        content: await getContext().i18n.translate(
          "components.join_button.messages.successfully_entered",
          {
            language: ctx.locale,
            params: { prize: state.prize },
          }
        ),
        ephemeral: true,
      });
    } else if (action === "giveaway_leave") {
      await stub.removeEntry.mutate({
        user_id: ctx.user.id,
      });
      return await ctx.send({
        content: await getContext().i18n.translate(
          "components.join_button.messages.successfully_left",
          {
            language: ctx.locale,
            params: { prize: state.prize },
          }
        ),
        ephemeral: true,
      });
    }
  } catch (error) {
    if (error instanceof TRPCClientError) {
      switch (error.data.code) {
        case "CONFLICT":
          return await ctx.send({
            content: await getContext().i18n.translate(
              "components.join_button.messages.already_entered_leave",
              {
                language: ctx.locale,
              }
            ),
            ephemeral: true,
            components: [
              {
                type: ComponentType.ACTION_ROW,
                components: [
                  {
                    type: ComponentType.BUTTON,
                    style: ButtonStyle.DANGER,
                    label: await getContext().i18n.translate(
                      "components.join_button.messages.leave_button",
                      {
                        language: ctx.locale,
                      }
                    ),
                    custom_id: `giveaway_leave:${giveawayId}`,
                  },
                ],
              },
            ],
          });
        case "NOT_FOUND":
          return await ctx.send({
            content: await getContext().i18n.translate(
              "components.join_button.errors.not_entered",
              {
                language: ctx.locale,
              }
            ),
            ephemeral: true,
          });
        case "PRECONDITION_FAILED":
          return await ctx.send({
            content: await getContext().i18n.translate(
              "components.join_button.errors.giveaway_ended",
              {
                language: ctx.locale,
              }
            ),
            ephemeral: true,
          });
        case "TOO_MANY_REQUESTS":
          return await ctx.send({
            content: await getContext().i18n.translate(
              "components.join_button.errors.rate_limited",
              {
                language: ctx.locale,
              }
            ),
            ephemeral: true,
          });
        default:
          console.error("Unexpected error:", error);
          return await ctx.send({
            content: await getContext().i18n.translate(
              "components.join_button.errors.unexpected_error",
              {
                language: ctx.locale,
              }
            ),
            ephemeral: true,
          });
      }
    } else {
      console.error("Unexpected error:", error);
      return await ctx.send({
        content: await getContext().i18n.translate(
          "components.join_button.errors.unexpected_error",
          {
            language: ctx.locale,
          }
        ),
        ephemeral: true,
      });
    }
  }
}
