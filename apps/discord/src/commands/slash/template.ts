import { and, eq, sql } from "@dougley/frugal-drizzle/workers";
import * as Schema from "@dougley/frugal-drizzle/workers/schema.js";
import { TRPCClientError } from "@dougley/frugal-savestate";
import { FEATURE_LIMITS } from "@dougley/frugal-subscriptions";
import { createGiveawayComponents, JoinButton } from "@dougley/frugal-utils";
import * as Sentry from "@sentry/cloudflare";
import {
  type AutocompleteContext,
  BitField,
  type CommandContext,
  CommandOptionType,
  InteractionContextType,
  type Message,
  MessageFlags,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";
import {
  getGiveawayTranslations,
  getJoinButtonTranslations,
} from "../../utils/giveaway-translations";

export default class TemplateCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "template",
      description: "Manage and use giveaway templates",
      contexts: [InteractionContextType.GUILD],
      requiredPermissions: ["MANAGE_EVENTS"],
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "list",
          description: "List all saved templates for this server",
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "use",
          description: "Start a giveaway from a template",
          options: [
            {
              type: CommandOptionType.STRING,
              name: "name",
              description: "Template name",
              required: true,
              autocomplete: true,
            },
            {
              type: CommandOptionType.STRING,
              name: "prize",
              description: "Override the template prize",
              required: false,
              min_length: 1,
              max_length: 100,
            },
          ],
        },
      ],
    });
  }

  async autocomplete(ctx: AutocompleteContext) {
    if (!ctx.guildID || !getContext().drizzle) return [];

    try {
      const focused = ctx.options.use?.name ?? "";
      const templates =
        await getContext().drizzle.query.giveawayTemplates.findMany({
          where: eq(Schema.giveawayTemplates.guildId, ctx.guildID),
          orderBy: (t, { desc }) => [desc(t.useCount), desc(t.createdAt)],
          limit: 25,
        });

      return templates
        .filter((t) => t.name.toLowerCase().includes(focused.toLowerCase()))
        .map((t) => ({ name: t.name, value: t.name }));
    } catch {
      return [];
    }
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
          "commands.template.messages.premium_required",
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
      const sub = ctx.subcommands[0] as string;

      if (sub === "list") {
        const templates = await drizzle.query.giveawayTemplates.findMany({
          where: eq(Schema.giveawayTemplates.guildId, guildId),
          orderBy: (t, { desc }) => [desc(t.useCount), desc(t.createdAt)],
          limit: 20,
        });

        const [titleText, noTemplatesText, entryTemplate] = await Promise.all([
          getContext().i18n.translate("commands.template.messages.title", {
            language: ctx.locale,
          }),
          getContext().i18n.translate(
            "commands.template.messages.no_templates",
            {
              language: ctx.locale,
              params: { url: "https://giveawaybot.party/dashboard" },
            }
          ),
          getContext().i18n.translate(
            "commands.template.messages.template_entry",
            {
              language: ctx.locale,
              params: {
                name: "{name}",
                winners: "{winners}",
                duration: "{duration}",
              },
            }
          ),
        ]);

        if (templates.length === 0) {
          return ctx.editOriginal(`## ${titleText}\n\n${noTemplatesText}`);
        }

        const lines = templates.map((t) => {
          const dur = formatDuration(t.durationMs);
          const entry = entryTemplate
            .replace("{name}", t.name)
            .replace("{winners}", String(t.winners))
            .replace("{duration}", dur);
          return `• ${entry}${t.prize ? ` — *${t.prize}*` : ""}`;
        });

        return ctx.editOriginal(`## ${titleText}\n\n${lines.join("\n")}`);
      }

      if (sub === "use") {
        const templateName = ctx.options.use?.name as string;
        const prizeOverride = ctx.options.use?.prize as string | undefined;

        const template = await drizzle.query.giveawayTemplates.findFirst({
          where: and(
            eq(Schema.giveawayTemplates.guildId, guildId),
            eq(Schema.giveawayTemplates.name, templateName)
          ),
        });

        if (!template) {
          return ctx.editOriginal(
            await getContext().i18n.translate(
              "commands.template.errors.not_found",
              { language: ctx.locale }
            )
          );
        }

        const prize = prizeOverride ?? template.prize;
        if (!prize) {
          return ctx.editOriginal(
            await getContext().i18n.translate(
              "commands.template.errors.no_prize",
              { language: ctx.locale }
            )
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

        const locale = ctx.locale ?? "en-US";
        const endTime = new Date(Date.now() + template.durationMs);
        const host = {
          id: ctx.user.id,
          username: ctx.user.username,
          avatar: ctx.user.avatar,
        };
        const channelID = template.channelId ?? ctx.channelID ?? "0";
        const id = getContext().env.GIVEAWAY_STATE.newUniqueId();
        const stub = getContext().state.getInstance(
          getContext().env.GIVEAWAY_STATE,
          id
        );

        await stub.reserveSlot.mutate({
          guild_id: guildId,
          host_id: host.id,
          winners: template.winners,
          end_time: endTime.toISOString(),
        });

        const [giveawayTranslations, joinButtonTranslations] =
          await Promise.all([
            getGiveawayTranslations(locale, {
              participants: 0,
              winners: template.winners,
            }),
            getJoinButtonTranslations(locale),
          ]);

        const flags = new BitField([
          MessageFlags.IS_COMPONENTS_V2,
          MessageFlags.SUPPRESS_EMBEDS,
        ]);

        let giveawayMessageId: string;

        try {
          const giveawayMessage = (await ctx.send({
            flags: flags.bitfield as number,
            allowedMentions: { parse: [] },
            components: createGiveawayComponents({
              prize,
              end_time: endTime,
              host_username: host.username,
              host_id: host.id,
              description: template.description ?? "",
              giveaway_id: id.toString(),
              join_button: JoinButton.createActionRow(
                id.toString(),
                joinButtonTranslations
              ),
              translations: giveawayTranslations,
            }),
          })) as Message;

          if (!giveawayMessage?.id) {
            await stub.releaseSlot.mutate();
            return ctx.editOriginal(
              await getContext().i18n.translate(
                "commands.start.errors.failed_to_create",
                { language: ctx.locale }
              )
            );
          }

          giveawayMessageId = giveawayMessage.id;
        } catch (error) {
          await stub.releaseSlot.mutate();
          throw error;
        }

        try {
          await stub.beginGiveaway.mutate({
            message_id: giveawayMessageId,
            channel_id: channelID,
            guild_id: guildId,
            prize,
            winners: template.winners,
            end_time: endTime.toISOString(),
            host_id: ctx.user.id,
            description: template.description || undefined,
            locale,
          });
          await stub.startAlarm.mutate(endTime.toISOString());
        } catch (error) {
          await stub.releaseSlot.mutate();
          await ctx.delete(giveawayMessageId);
          throw error;
        }

        await drizzle
          .update(Schema.giveawayTemplates)
          .set({
            useCount: sql<number>`${Schema.giveawayTemplates.useCount} + 1`,
          })
          .where(eq(Schema.giveawayTemplates.id, template.id));

        const launchedMsg = await getContext().i18n.translate(
          "commands.template.messages.launched",
          { language: ctx.locale, params: { name: template.name } }
        );
        return ctx.editOriginal(launchedMsg);
      }

      return ctx.editOriginal(
        await getContext().i18n.translate("common.errors.unexpected", {
          language: ctx.locale,
        })
      );
    } catch (error) {
      console.error("Error in template command:", error);

      if (error instanceof TRPCClientError) {
        if (
          error.data?.code === "PRECONDITION_FAILED" &&
          error.message === "CONCURRENT_LIMIT_EXCEEDED"
        ) {
          const msg = await getContext().i18n.translate(
            "commands.start.errors.concurrent_limit",
            {
              language: ctx.locale,
              params: {
                max: FEATURE_LIMITS.CONCURRENT_GIVEAWAYS.FREE.toString(),
                premiumMax:
                  FEATURE_LIMITS.CONCURRENT_GIVEAWAYS.PREMIUM.toString(),
              },
            }
          );
          return ctx.editOriginal(msg);
        }
      }

      Sentry.captureException(error);
      return ctx.editOriginal(
        await getContext().i18n.translate("common.errors.unexpected", {
          language: ctx.locale,
        })
      );
    }
  }
}

function formatDuration(ms: number): string {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d${h > 0 ? ` ${h}h` : ""}`;
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ""}`;
  return `${m}m`;
}
