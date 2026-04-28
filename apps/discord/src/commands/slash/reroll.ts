import { and, eq, Schema } from "@dougley/frugal-drizzle/workers";
import { FEATURE_LIMITS } from "@dougley/frugal-subscriptions";
import * as Sentry from "@sentry/cloudflare";
import {
  type AutocompleteContext,
  type CommandContext,
  CommandOptionType,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";

interface WinnerInfo {
  id: string | null;
  username: string | null;
  discriminator: string;
  avatar: string | null;
}

export default class RerollCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "reroll",
      description: "Reroll a giveaway",
      options: [
        {
          type: CommandOptionType.STRING,
          name: "id",
          description: "ID of the giveaway to reroll",
          required: true,
          autocomplete: true,
        },
        {
          type: CommandOptionType.INTEGER,
          name: "count",
          description:
            "Number of winners to reroll (free defaults to 1; premium can reroll more/all)",
          required: false,
          min_value: 1,
          max_value: FEATURE_LIMITS.MAX_WINNERS.PREMIUM,
        },
      ],
    });
  }

  async autocomplete(ctx: AutocompleteContext) {
    if (!getContext().env?.D1 || !getContext().drizzle) {
      return [];
    }

    if (!ctx.guildID) return [];

    // Use string keys to match DB columns
    const closedGiveaways = await getContext()
      .drizzle.select()
      .from(Schema.giveaways)
      .where(
        and(
          eq(Schema.giveaways.guildId, ctx.guildID),
          eq(Schema.giveaways.state, "CLOSED")
        )
      )
      .orderBy(Schema.giveaways.endTime)
      .limit(25);

    const { i18n } = getContext();
    const locale = ctx.locale ?? "en-US";

    const choices = await Promise.all(
      closedGiveaways.map(async (g) => {
        const formattedText = await i18n.translate(
          "autocomplete.giveaway.format",
          {
            language: locale,
            params: {
              prize: g.prize,
              winners: g.winners.toString(),
              date: new Date(g.endTime).toLocaleDateString(locale),
            },
          }
        );
        return {
          name: formattedText.slice(0, 100),
          value: g.durableObjectId,
        };
      })
    );

    return choices;
  }

  async run(ctx: CommandContext) {
    await ctx.defer();

    try {
      if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.giveaway_state_unavailable",
          {
            language: ctx.locale,
          }
        );
        return ctx.editOriginal(errorMessage);
      }

      const giveawayId = ctx.options.id;
      const requestedCount = ctx.options.count as number | undefined;

      const subscription = await this.getPremiumStatus(ctx);

      if (
        !subscription.hasPremium &&
        requestedCount != null &&
        requestedCount > 1
      ) {
        Sentry.addBreadcrumb({
          category: "giveaway.reroll",
          message: "count limit hit (free)",
          level: "info",
          data: {
            giveawayId,
            guildId: ctx.guildID ?? null,
            userId: ctx.user.id,
            requestedCount,
          },
        });

        const errorMessage = await getContext().i18n.translate(
          "commands.reroll.errors.count_limit_free",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      const stub = getContext().state.getInstance(
        getContext().env.GIVEAWAY_STATE,
        getContext().env.GIVEAWAY_STATE.idFromString(giveawayId)
      );

      const state = await stub.getState.query();

      if (!state) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.giveaway_not_found",
          {
            language: ctx.locale,
          }
        );
        return ctx.editOriginal(errorMessage);
      }

      const maxRerollCount = Math.min(50, state.winners);

      if (requestedCount != null && requestedCount > maxRerollCount) {
        const errorMessage = await getContext().i18n.translate(
          "commands.reroll.errors.count_too_many",
          {
            language: ctx.locale,
            params: {
              max: maxRerollCount.toString(),
            },
          }
        );
        return ctx.editOriginal(errorMessage);
      }

      if (state.state !== "CLOSED") {
        const errorMessage = await getContext().i18n.translate(
          "commands.reroll.errors.still_running",
          {
            language: ctx.locale,
          }
        );
        return ctx.editOriginal(errorMessage);
      }

      // Helper to coerce winner fields to string|null
      const mapWinners = (
        winners: {
          id?: string | number | null;
          username?: string | null;
          discriminator?: string | null;
          avatar?: string | null;
        }[]
      ): WinnerInfo[] =>
        winners.map((w) => ({
          id: w.id != null ? String(w.id) : null,
          username: w.username != null ? String(w.username) : null,
          discriminator: w.discriminator != null ? String(w.discriminator) : "",
          avatar: w.avatar != null ? String(w.avatar) : null,
        }));

      // Free users can only reroll one winner per command.
      // So for free: treat missing count as 1.
      if (!subscription.hasPremium) {
        const result = await stub.drawWinners.mutate(1);

        if (!result.success || !result.winners || result.winners.length === 0) {
          const errorMessage = await getContext().i18n.translate(
            "commands.reroll.errors.no_entries",
            {
              language: ctx.locale,
            }
          );
          return ctx.editOriginal(errorMessage);
        }

        const winners = mapWinners(result.winners);
        const winnerMentions = winners
          .map((winner) => (winner.id ? `<@${winner.id}>` : null))
          .filter(Boolean)
          .join(", ");
        const allowedMentionIds = winners
          .map((w) => w.id)
          .filter((id): id is string => typeof id === "string");

        const successMessage = await getContext().i18n.translate(
          "commands.reroll.messages.success",
          {
            language: ctx.locale,
            params: {
              count: winners.length,
              winners: winnerMentions,
            },
          }
        );

        return ctx.editOriginal({
          content: successMessage,
          allowedMentions: {
            users: allowedMentionIds,
            everyone: false,
            roles: [],
          },
        });
      }

      // Premium behavior: allow rerolling N winners or all winners.
      if (requestedCount != null) {
        const result = await stub.drawWinners.mutate(requestedCount);

        if (!result.success || !result.winners || result.winners.length === 0) {
          const errorMessage = await getContext().i18n.translate(
            "commands.reroll.errors.no_entries",
            {
              language: ctx.locale,
            }
          );
          return ctx.editOriginal(errorMessage);
        }

        const winners = mapWinners(result.winners);
        const winnerMentions = winners
          .map((winner) => (winner.id ? `<@${winner.id}>` : null))
          .filter(Boolean)
          .join(", ");
        const allowedMentionIds = winners
          .map((w) => w.id)
          .filter((id): id is string => typeof id === "string");

        const successMessage = await getContext().i18n.translate(
          "commands.reroll.messages.success",
          {
            language: ctx.locale,
            params: {
              count: winners.length,
              winners: winnerMentions,
            },
          }
        );

        return ctx.editOriginal({
          content: successMessage,
          allowedMentions: {
            users: allowedMentionIds,
            everyone: false,
            roles: [],
          },
        });
      }

      const result = await stub.drawWinners.mutate(maxRerollCount);

      if (!result.success || !result.winners || result.winners.length === 0) {
        const errorMessage = await getContext().i18n.translate(
          "commands.reroll.errors.no_entries",
          {
            language: ctx.locale,
          }
        );
        return ctx.editOriginal(errorMessage);
      }

      const winners = mapWinners(result.winners);
      const winnerMentions = winners
        .map((winner) => (winner.id ? `<@${winner.id}>` : null))
        .filter(Boolean)
        .join(", ");
      const allowedMentionIds = winners
        .map((w) => w.id)
        .filter((id): id is string => typeof id === "string");

      const successMessage = await getContext().i18n.translate(
        "commands.reroll.messages.success",
        {
          language: ctx.locale,
          params: {
            count: winners.length,
            winners: winnerMentions,
          },
        }
      );

      return ctx.editOriginal({
        content: successMessage,
        allowedMentions: {
          users: allowedMentionIds,
          everyone: false,
          roles: [],
        },
      });
    } catch (error) {
      console.error("Error in reroll command:", error);
      Sentry.captureException(error);

      return ctx.editOriginal(
        await getContext().i18n.translate("common.errors.unexpected", {
          language: ctx.locale,
        })
      );
    }
  }
}
