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

export default class CopyIdCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      type: ApplicationCommandType.MESSAGE,
      name: "copy_giveaway_id",
      description: "Copy the giveaway ID from a giveaway message",
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
          prize: Schema.giveaways.prize,
          state: Schema.giveaways.state,
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

      const message = await getContext().i18n.translate(
        "commands.copy_giveaway_id.messages.result",
        {
          language: ctx.locale,
          params: {
            id: giveaway.durableObjectId,
            prize: giveaway.prize,
            state: giveaway.state,
          },
        }
      );

      return ctx.editOriginal(message);
    } catch (error) {
      console.error("Error in copy_giveaway_id command:", error);
      Sentry.captureException(error);

      const errorMessage = await getContext().i18n.translate(
        "common.errors.unexpected",
        { language: ctx.locale }
      );
      return ctx.editOriginal(errorMessage);
    }
  }
}
