import { count, eq, sql } from "@dougley/frugal-drizzle/workers";
import * as Schema from "@dougley/frugal-drizzle/workers/schema.js";
import * as Sentry from "@sentry/cloudflare";
import {
  type CommandContext,
  InteractionContextType,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";

export default class AnalyticsCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "analytics",
      description: "View giveaway analytics for this server",
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

      const subscription = await this.getPremiumStatus(ctx);
      if (!subscription.hasPremium) {
        const msg = await getContext().i18n.translate(
          "commands.analytics.messages.premium_required",
          {
            language: ctx.locale,
            params: { url: "https://giveawaybot.party/premium" },
          }
        );
        return ctx.editOriginal(msg);
      }

      if (!getContext().env?.D1 || !getContext().drizzle) {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "common.errors.database_unavailable",
            { language: ctx.locale }
          )
        );
      }

      const drizzle = getContext().drizzle;
      const guildId = ctx.guildID;

      const [aggregates, topGiveaways] = await Promise.all([
        drizzle
          .select({
            total: count(),
            totalEntries: sql<number>`COALESCE(SUM(${Schema.giveaways.entryCount}), 0)`,
            activeCount:
              sql<number>`SUM(CASE WHEN ${Schema.giveaways.state} != 'CLOSED' THEN 1 ELSE 0 END)`.as(
                "active_count"
              ),
            closedCount:
              sql<number>`SUM(CASE WHEN ${Schema.giveaways.state} = 'CLOSED' THEN 1 ELSE 0 END)`.as(
                "closed_count"
              ),
          })
          .from(Schema.giveaways)
          .where(eq(Schema.giveaways.guildId, guildId)),

        drizzle.query.giveaways.findMany({
          where: eq(Schema.giveaways.guildId, guildId),
          orderBy: (g, { desc }) => [desc(g.entryCount)],
          limit: 5,
        }),
      ]);

      const row = aggregates[0];
      const total = row?.total ?? 0;
      const totalEntries = Number(row?.totalEntries ?? 0);
      const avgEntries = total > 0 ? Math.round(totalEntries / total) : 0;
      const active = Number(row?.activeCount ?? 0);
      const closed = Number(row?.closedCount ?? 0);

      const [
        titleText,
        totalLabel,
        totalEntriesLabel,
        avgLabel,
        activeLabel,
        closedLabel,
        topLabel,
        topEntryTemplate,
      ] = await Promise.all([
        getContext().i18n.translate("commands.analytics.messages.title", {
          language: ctx.locale,
        }),
        getContext().i18n.translate("commands.analytics.messages.total", {
          language: ctx.locale,
        }),
        getContext().i18n.translate(
          "commands.analytics.messages.total_entries",
          { language: ctx.locale }
        ),
        getContext().i18n.translate("commands.analytics.messages.avg_entries", {
          language: ctx.locale,
        }),
        getContext().i18n.translate("commands.analytics.messages.active", {
          language: ctx.locale,
        }),
        getContext().i18n.translate("commands.analytics.messages.closed", {
          language: ctx.locale,
        }),
        getContext().i18n.translate(
          "commands.analytics.messages.top_giveaways",
          { language: ctx.locale }
        ),
        getContext().i18n.translate("commands.analytics.messages.top_entry", {
          language: ctx.locale,
          params: { prize: "{prize}", entries: "{entries}" },
        }),
      ]);

      const topLines = topGiveaways.map((g) =>
        topEntryTemplate
          .replace("{prize}", g.prize)
          .replace("{entries}", String(g.entryCount ?? 0))
      );

      const lines = [
        `## ${titleText}`,
        "",
        `**${totalLabel}:** ${total}  |  **${activeLabel}:** ${active}  |  **${closedLabel}:** ${closed}`,
        `**${totalEntriesLabel}:** ${totalEntries.toLocaleString()}  |  **${avgLabel}:** ${avgEntries}`,
        "",
        `**${topLabel}:**`,
        ...(topLines.length > 0 ? topLines.map((l) => `• ${l}`) : ["—"]),
      ];

      return ctx.editOriginal(lines.join("\n"));
    } catch (error) {
      console.error("Error in analytics command:", error);
      Sentry.captureException(error);
      return ctx.editOriginal(
        await getContext().i18n.translate("common.errors.unexpected", {
          language: ctx.locale,
        })
      );
    }
  }
}
