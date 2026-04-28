import {
  and,
  asc,
  eq,
  type InferSelectModel,
  inArray,
  Schema,
} from "@dougley/frugal-drizzle/workers";
import * as Sentry from "@sentry/cloudflare";
import {
  type CommandContext,
  InteractionContextType,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";

type GiveawayRow = InferSelectModel<typeof Schema.giveaways>;

export default class ListCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "list",
      description:
        "Lists all giveaways in the server that are currently running",
      contexts: [InteractionContextType.GUILD],
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();

    if (!ctx.guildID) {
      const errorMessage = await getContext().i18n.translate(
        "common.errors.guild_only",
        { language: ctx.locale }
      );
      return ctx.editOriginal(errorMessage);
    }

    const guildId = ctx.guildID;

    if (!getContext().env?.D1 || !getContext().drizzle) {
      const errorMessage = await getContext().i18n.translate(
        "common.errors.database_unavailable",
        { language: ctx.locale }
      );
      return ctx.editOriginal(errorMessage);
    }

    let currentGiveaways: GiveawayRow[] = [];

    try {
      // Fast path: use the reservation table to find current giveaway IDs.
      // Fallback to querying Giveaways directly if reservations are missing.
      const reserved = await getContext()
        .drizzle.select({
          durableObjectId: Schema.guildActiveGiveaways.durableObjectId,
        })
        .from(Schema.guildActiveGiveaways)
        .where(eq(Schema.guildActiveGiveaways.guildId, guildId))
        .all();

      const reservedIds = reserved.map((row) => row.durableObjectId);

      if (reservedIds.length > 0) {
        currentGiveaways = await getContext()
          .drizzle.select()
          .from(Schema.giveaways)
          .where(
            and(
              eq(Schema.giveaways.guildId, guildId),
              eq(Schema.giveaways.state, "OPEN"),
              inArray(Schema.giveaways.durableObjectId, reservedIds)
            )
          )
          .orderBy(asc(Schema.giveaways.endTime))
          .all();
      }

      if (currentGiveaways.length === 0) {
        currentGiveaways = await getContext()
          .drizzle.select()
          .from(Schema.giveaways)
          .where(
            and(
              eq(Schema.giveaways.guildId, guildId),
              eq(Schema.giveaways.state, "OPEN")
            )
          )
          .orderBy(asc(Schema.giveaways.endTime))
          .all();
      }
    } catch (error) {
      console.error("Failed to list giveaways:", error);
      Sentry.captureException(error);

      const errorMessage = await getContext().i18n.translate(
        "common.errors.database_unavailable",
        { language: ctx.locale }
      );
      return ctx.editOriginal(errorMessage);
    }

    if (currentGiveaways.length === 0) {
      const noGiveawaysMessage = await getContext().i18n.translate(
        "commands.list.messages.no_giveaways",
        { language: ctx.locale }
      );
      return ctx.editOriginal(noGiveawaysMessage);
    }

    const description = await Promise.all(
      currentGiveaways.map(async (giveaway) => {
        const winnersText = await getContext().i18n.translate(
          "common.labels.winners",
          {
            language: ctx.locale,
            params: { count: giveaway.winners },
          }
        );
        const timestamp = Math.floor(
          new Date(giveaway.endTime).getTime() / 1000
        );
        const endsText = await getContext().i18n.translate(
          "common.labels.ends",
          {
            language: ctx.locale,
          }
        );
        return `[**${giveaway.prize}**](https://discord.com/channels/${guildId}/${giveaway.channelId}/${giveaway.messageId}) - ${winnersText} - ${endsText} <t:${timestamp}:R> (<t:${timestamp}:F>)`;
      })
    );

    const title = await getContext().i18n.translate(
      "commands.list.messages.title",
      {
        language: ctx.locale,
      }
    );

    return ctx.editOriginal({
      embeds: [
        {
          title,
          description: description.join("\n"),
          color: 0x00ff00,
        },
      ],
    });
  }
}
