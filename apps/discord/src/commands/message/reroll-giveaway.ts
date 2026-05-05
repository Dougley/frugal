import { and, eq, Schema } from "@dougley/frugal-drizzle/workers";
import * as Sentry from "@sentry/cloudflare";
import {
  ApplicationCommandType,
  type CommandContext,
  InteractionContextType,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";
import { canManageGiveaway } from "../../utils/giveaway-permissions";

export default class RerollGiveawayCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      type: ApplicationCommandType.MESSAGE,
      name: "reroll_giveaway",
      contexts: [InteractionContextType.GUILD],
      requiredPermissions: ["MANAGE_EVENTS"],
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer(true);

    try {
      if (!ctx.guildID) {
        return ctx.editOriginal(
          await getContext().i18n.translate("common.errors.guild_only", {
            language: ctx.locale,
          })
        );
      }

      if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "common.errors.giveaway_state_unavailable",
            { language: ctx.locale }
          )
        );
      }

      if (!getContext().env?.D1 || !getContext().drizzle) {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "common.errors.database_unavailable",
            { language: ctx.locale }
          )
        );
      }

      const targetMessage = ctx.targetMessage;
      if (!targetMessage) {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "common.errors.not_giveaway_message",
            { language: ctx.locale }
          )
        );
      }

      const giveaway = await getContext()
        .drizzle.select({
          durableObjectId: Schema.giveaways.durableObjectId,
          prize: Schema.giveaways.prize,
        })
        .from(Schema.giveaways)
        .where(
          and(
            eq(Schema.giveaways.guildId, ctx.guildID),
            eq(Schema.giveaways.channelId, targetMessage.channelID),
            eq(Schema.giveaways.messageId, targetMessage.id)
          )
        )
        .get();

      if (!giveaway) {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "common.errors.not_giveaway_message",
            { language: ctx.locale }
          )
        );
      }

      const stub = getContext().state.getInstance(
        getContext().env.GIVEAWAY_STATE,
        getContext().env.GIVEAWAY_STATE.idFromString(giveaway.durableObjectId)
      );

      const state = await stub.getState.query();

      if (!state) {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "common.errors.giveaway_not_found",
            { language: ctx.locale }
          )
        );
      }

      if (!canManageGiveaway(ctx, state)) {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "common.errors.manage_giveaway_denied",
            { language: ctx.locale }
          )
        );
      }

      if (state.state !== "CLOSED") {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "commands.reroll.errors.still_running",
            { language: ctx.locale }
          )
        );
      }

      const subscription = await this.getPremiumStatus(ctx);
      const maxRerollCount = Math.min(50, state.winners);
      const drawCount = subscription.hasPremium ? maxRerollCount : 1;

      const result = await stub.drawWinners.mutate(drawCount);

      if (!result.success || !result.winners || result.winners.length === 0) {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "commands.reroll.errors.no_entries",
            { language: ctx.locale }
          )
        );
      }

      const winnerMentions = result.winners
        .map((w) => (w.id != null ? `<@${w.id}>` : null))
        .filter(Boolean)
        .join(", ");
      const allowedMentionIds = result.winners
        .map((w) => (w.id != null ? String(w.id) : null))
        .filter((id): id is string => id !== null);

      const successMessage = await getContext().i18n.translate(
        "commands.reroll.messages.success",
        {
          language: ctx.locale,
          params: {
            count: result.winners.length,
            winners: winnerMentions,
          },
        }
      );

      return ctx.send({
        content: successMessage,
        allowedMentions: {
          users: allowedMentionIds,
          everyone: false,
          roles: [],
        },
      });
    } catch (error) {
      console.error("Error in reroll_giveaway command:", error);
      Sentry.captureException(error);

      return ctx.editOriginal(
        await getContext().i18n.translate("common.errors.unexpected", {
          language: ctx.locale,
        })
      );
    }
  }
}
