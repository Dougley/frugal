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

export default class EndGiveawayCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      type: ApplicationCommandType.MESSAGE,
      name: "end_giveaway",
      contexts: [InteractionContextType.GUILD],
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

      if (state.state !== "OPEN") {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "commands.stop.errors.not_running",
            {
              language: ctx.locale,
            }
          )
        );
      }

      await stub.endGiveaway.mutate();

      return ctx.editOriginal(
        await getContext().i18n.translate("commands.stop.messages.success", {
          language: ctx.locale,
          params: { prize: state.prize },
        })
      );
    } catch (error) {
      console.error("Error in end_giveaway command:", error);
      Sentry.captureException(error);

      return ctx.editOriginal(
        await getContext().i18n.translate("commands.stop.errors.failed", {
          language: ctx.locale,
        })
      );
    }
  }
}
