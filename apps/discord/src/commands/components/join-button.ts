import { TRPCClientError } from "@dougley/frugal-savestate";
import { JoinButton } from "@dougley/frugal-utils";
import * as Sentry from "@sentry/cloudflare";
import type { ComponentContext } from "slash-create/web";
import { getContext } from "../../context";
import { isValidGiveawayId } from "../../utils/giveaway-autocomplete";
import { createEntryActionRow } from "../../utils/giveaway-status";

const ACTION_LEAVE = "giveaway_leave";

export const custom_id_regex = JoinButton.custom_id_regex;

export async function handleInteraction(ctx: ComponentContext) {
  const [action, giveawayId] = ctx.customID.split(":");
  const { env, state, i18n } = getContext();
  const locale = ctx.locale || "en-US";

  try {
    if (!isValidGiveawayId(giveawayId)) {
      return await ctx.send({
        content: await i18n.translate("common.errors.invalid_giveaway_id", {
          language: locale,
        }),
        ephemeral: true,
      });
    }

    if (!env?.GIVEAWAY_STATE || !state) {
      return await ctx.send({
        content: await i18n.translate(
          "common.errors.giveaway_state_unavailable",
          {
            language: locale,
          }
        ),
        ephemeral: true,
      });
    }

    const stub = state.getInstance(
      env.GIVEAWAY_STATE,
      env.GIVEAWAY_STATE.idFromString(giveawayId)
    );

    const instance = await stub.getState.query();

    if (!instance) {
      return await ctx.send({
        content: await i18n.translate("common.errors.giveaway_not_found", {
          language: locale,
        }),
        ephemeral: true,
      });
    }

    if (instance.state !== "OPEN") {
      return await ctx.send({
        content: await i18n.translate(
          "components.join_button.errors.not_open",
          {
            language: locale,
          }
        ),
        ephemeral: true,
      });
    }

    if (action === JoinButton.custom_id) {
      await stub.addEntry.mutate({
        user_id: ctx.user.id,
        username: ctx.user.username,
        avatar: ctx.user.avatar || null,
        discriminator: ctx.user.discriminator,
      });
      return await ctx.send({
        content: await i18n.translate(
          "components.join_button.messages.entered",
          {
            language: locale,
            params: { prize: instance.prize },
          }
        ),
        ephemeral: true,
        components: [
          await createEntryActionRow({
            giveawayId,
            locale,
            nextAction: "leave",
          }),
        ],
      });
    } else if (action === ACTION_LEAVE) {
      await stub.removeEntry.mutate({
        user_id: ctx.user.id,
      });
      return await ctx.send({
        content: await i18n.translate("components.join_button.messages.left", {
          language: locale,
          params: { prize: instance.prize },
        }),
        ephemeral: true,
        components: [
          await createEntryActionRow({
            giveawayId,
            locale,
            nextAction: "join",
          }),
        ],
      });
    }

    return await ctx.send({
      content: await i18n.translate(
        "components.join_button.errors.invalid_action",
        {
          language: locale,
        }
      ),
      ephemeral: true,
    });
  } catch (error) {
    if (error instanceof TRPCClientError) {
      switch (error.data.code) {
        case "CONFLICT":
          return await ctx.send({
            content: await i18n.translate(
              "components.join_button.messages.already_entered_prompt",
              {
                language: locale,
              }
            ),
            ephemeral: true,
            components: [
              await createEntryActionRow({
                giveawayId,
                locale,
                nextAction: "leave",
              }),
            ],
          });
        case "NOT_FOUND":
          return await ctx.send({
            content: await i18n.translate(
              "components.join_button.errors.not_entered",
              {
                language: locale,
              }
            ),
            ephemeral: true,
          });
        case "PRECONDITION_FAILED":
          return await ctx.send({
            content: await i18n.translate(
              "components.join_button.errors.ended",
              {
                language: locale,
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
            content: await i18n.translate("common.errors.rate_limited", {
              language: locale,
            }),
            ephemeral: true,
          });
      }
    }

    console.error("Unexpected error:", error);
    Sentry.captureException(error);
    return await ctx.send({
      content: await i18n.translate("common.errors.unexpected", {
        language: locale,
      }),
      ephemeral: true,
    });
  }
}
