import { TRPCClientError } from "@dougley/frugal-savestate";
import { JoinButton } from "@dougley/frugal-utils";
import * as Sentry from "@sentry/cloudflare";
import type { ComponentContext } from "slash-create/web";
import { getContext } from "../../context";
import { isValidGiveawayId } from "../../utils/giveaway-autocomplete";
import { createEntryActionRow } from "../../utils/giveaway-status";

// Export patterns for commands/index.ts
export const custom_id_regex = JoinButton.custom_id_regex;

/**
 * Handles the button interaction when a user enters a giveaway
 * @param ctx The component context
 */
export async function handleInteraction(ctx: ComponentContext) {
  const [action, giveawayId] = ctx.customID.split(":");

  try {
    if (!isValidGiveawayId(giveawayId)) {
      return await ctx.send({
        content: await getContext().i18n.translate(
          "components.join_button.errors.invalid_id",
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
          "common.errors.giveaway_state_unavailable",
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

    if (!state) {
      return await ctx.send({
        content: await getContext().i18n.translate(
          "common.errors.giveaway_not_found",
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
          "components.join_button.errors.not_open",
          {
            language: ctx.locale,
          }
        ),
        ephemeral: true,
      });
    }

    if (action === "giveaway_join") {
      await stub.addEntry.mutate({
        user_id: ctx.user.id,
        username: ctx.user.username,
        avatar: ctx.user.avatar || null,
        discriminator: ctx.user.discriminator,
      });
      return await ctx.send({
        content: await getContext().i18n.translate(
          "components.join_button.messages.entered",
          {
            language: ctx.locale,
            params: { prize: state.prize },
          }
        ),
        ephemeral: true,
        components: [
          await createEntryActionRow({
            giveawayId,
            locale: ctx.locale,
            nextAction: "leave",
          }),
        ],
      });
    } else if (action === "giveaway_leave") {
      await stub.removeEntry.mutate({
        user_id: ctx.user.id,
      });
      return await ctx.send({
        content: await getContext().i18n.translate(
          "components.join_button.messages.left",
          {
            language: ctx.locale,
            params: { prize: state.prize },
          }
        ),
        ephemeral: true,
        components: [
          await createEntryActionRow({
            giveawayId,
            locale: ctx.locale,
            nextAction: "join",
          }),
        ],
      });
    }

    return await ctx.send({
      content: await getContext().i18n.translate(
        "components.join_button.errors.invalid_action",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  } catch (error) {
    if (error instanceof TRPCClientError) {
      switch (error.data.code) {
        case "CONFLICT":
          return await ctx.send({
            content: await getContext().i18n.translate(
              "components.join_button.messages.already_entered_prompt",
              {
                language: ctx.locale,
              }
            ),
            ephemeral: true,
            components: [
              await createEntryActionRow({
                giveawayId,
                locale: ctx.locale,
                nextAction: "leave",
              }),
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
              "components.join_button.errors.ended",
              {
                language: ctx.locale,
              }
            ),
            ephemeral: true,
          });
        case "TOO_MANY_REQUESTS":
          Sentry.addBreadcrumb({
            category: "giveaway.join_button",
            message: "entry rate limited",
            level: "info",
            data: {
              userId: ctx.user.id,
              customId: ctx.customID,
            },
          });
          return await ctx.send({
            content: await getContext().i18n.translate(
              "common.errors.rate_limited",
              {
                language: ctx.locale,
              }
            ),
            ephemeral: true,
          });
        default:
          console.error("Unexpected error:", error);
          Sentry.captureException(error);
          return await ctx.send({
            content: await getContext().i18n.translate(
              "common.errors.unexpected",
              {
                language: ctx.locale,
              }
            ),
            ephemeral: true,
          });
      }
    } else {
      console.error("Unexpected error:", error);
      Sentry.captureException(error);
      return await ctx.send({
        content: await getContext().i18n.translate("common.errors.unexpected", {
          language: ctx.locale,
        }),
        ephemeral: true,
      });
    }
  }
}
