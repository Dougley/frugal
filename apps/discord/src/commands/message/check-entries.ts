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

export default class CheckEntriesCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      type: ApplicationCommandType.USER,
      name: "check_entries",
      contexts: [InteractionContextType.GUILD],
      requiredPermissions: ["MANAGE_EVENTS"],
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

      if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.giveaway_state_unavailable",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      const targetUser = ctx.targetUser;
      if (!targetUser) {
        const errorMessage = await getContext().i18n.translate(
          "commands.check_entries.errors.no_target",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      const guildId = ctx.guildID;

      const activeGiveaways = await getContext()
        .drizzle.select({
          durableObjectId: Schema.giveaways.durableObjectId,
          prize: Schema.giveaways.prize,
          winners: Schema.giveaways.winners,
          endTime: Schema.giveaways.endTime,
          channelId: Schema.giveaways.channelId,
          messageId: Schema.giveaways.messageId,
        })
        .from(Schema.giveaways)
        .where(
          and(
            eq(Schema.giveaways.guildId, guildId),
            eq(Schema.giveaways.state, "OPEN")
          )
        )
        .all();

      if (activeGiveaways.length === 0) {
        const message = await getContext().i18n.translate(
          "commands.check_entries.messages.no_active_giveaways",
          {
            language: ctx.locale,
            params: { user: `<@${targetUser.id}>` },
          }
        );
        return ctx.editOriginal(message);
      }

      const results: {
        prize: string;
        channelId: string;
        messageId: string;
        endTime: string;
        entered: boolean;
      }[] = [];

      const BATCH_SIZE = 5;
      for (let i = 0; i < activeGiveaways.length; i += BATCH_SIZE) {
        const batch = activeGiveaways.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.all(
          batch.map(async (giveaway) => {
            try {
              const stub = getContext().state.getInstance(
                getContext().env.GIVEAWAY_STATE,
                getContext().env.GIVEAWAY_STATE.idFromString(
                  giveaway.durableObjectId
                )
              );
              const entries = await stub.getEntries.query();
              const entered = entries.some(
                (entry) => entry.userId === targetUser.id
              );
              return {
                prize: giveaway.prize,
                channelId: giveaway.channelId,
                messageId: giveaway.messageId,
                endTime: giveaway.endTime,
                entered,
              };
            } catch {
              return {
                prize: giveaway.prize,
                channelId: giveaway.channelId,
                messageId: giveaway.messageId,
                endTime: giveaway.endTime,
                entered: false,
              };
            }
          })
        );

        results.push(...batchResults);
      }

      const enteredGiveaways = results.filter((r) => r.entered);
      const totalActive = results.length;

      if (enteredGiveaways.length === 0) {
        const message = await getContext().i18n.translate(
          "commands.check_entries.messages.not_entered_any",
          {
            language: ctx.locale,
            params: {
              user: `<@${targetUser.id}>`,
              total: totalActive.toString(),
            },
          }
        );
        return ctx.editOriginal(message);
      }

      const lines = await Promise.all(
        enteredGiveaways.map(async (g) => {
          const timestamp = Math.floor(new Date(g.endTime).getTime() / 1000);
          return await getContext().i18n.translate(
            "commands.check_entries.messages.entry_line",
            {
              language: ctx.locale,
              params: {
                prize: g.prize,
                link: `https://discord.com/channels/${guildId}/${g.channelId}/${g.messageId}`,
                endTime: `<t:${timestamp}:R>`,
              },
            }
          );
        })
      );

      const message = await getContext().i18n.translate(
        "commands.check_entries.messages.result",
        {
          language: ctx.locale,
          params: {
            user: `<@${targetUser.id}>`,
            entered: enteredGiveaways.length.toString(),
            total: totalActive.toString(),
            entries: lines.join("\n"),
          },
        }
      );

      return ctx.editOriginal(message);
    } catch (error) {
      console.error("Error in check_entries command:", error);
      Sentry.captureException(error);

      const errorMessage = await getContext().i18n.translate(
        "common.errors.unexpected",
        { language: ctx.locale }
      );
      return ctx.editOriginal(errorMessage);
    }
  }
}
