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
import { createGiveawayStatusResponse } from "../../utils/giveaway-status";

export default class GiveawayStatusCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      type: ApplicationCommandType.MESSAGE,
      name: "giveaway_status",
      contexts: [InteractionContextType.GUILD],
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer(true);

    try {
      if (!ctx.guildID) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.guild_only",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.giveaway_state_unavailable",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      if (!getContext().env?.D1 || !getContext().drizzle) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.database_unavailable",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      const targetMessage = ctx.targetMessage;
      if (!targetMessage) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.not_giveaway_message",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      const giveaway = await getContext()
        .drizzle.select({
          durableObjectId: Schema.giveaways.durableObjectId,
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
        const errorMessage = await getContext().i18n.translate(
          "common.errors.not_giveaway_message",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      const stub = getContext().state.getInstance(
        getContext().env.GIVEAWAY_STATE,
        getContext().env.GIVEAWAY_STATE.idFromString(giveaway.durableObjectId)
      );

      const [state, firstPage] = await Promise.all([
        stub.getState.query(),
        stub.getEntriesPaginated.query({ page: 1, limit: 100 }),
      ]);

      if (!state) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.giveaway_not_found",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      return ctx.editOriginal(
        await createGiveawayStatusResponse({
          giveawayId: giveaway.durableObjectId,
          locale: ctx.locale,
          state,
          userId: ctx.user.id,
          entries: firstPage.entries,
          totalEntries: firstPage.total,
        })
      );
    } catch (error) {
      console.error("Error in giveaway status command:", error);
      Sentry.captureException(error);

      const errorMessage = await getContext().i18n.translate(
        "common.errors.unexpected",
        { language: ctx.locale }
      );
      return ctx.editOriginal(errorMessage);
    }
  }
}
