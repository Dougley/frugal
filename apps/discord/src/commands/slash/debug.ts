import { desc, eq, or, Schema } from "@dougley/frugal-drizzle/workers";
import { JoinButton } from "@dougley/frugal-utils";
import * as Sentry from "@sentry/cloudflare";
import {
  type CommandContext,
  CommandOptionType,
  InteractionContextType,
  type Message,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";

type DebugAction =
  | "savestate_full"
  | "savestate_alarm"
  | "savestate_info"
  | "premium"
  | "entitlements";

type EntitlementScope = "guild" | "user" | "both";

export default class DebugCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "debug",
      description: "Debug and diagnostics",
      contexts: [InteractionContextType.GUILD],
      options: [
        {
          type: CommandOptionType.STRING,
          name: "action",
          description: "What debug action to run",
          required: true,
          choices: [
            { name: "Savestate: Full", value: "savestate_full" },
            { name: "Savestate: Alarm", value: "savestate_alarm" },
            { name: "Savestate: Info", value: "savestate_info" },
            { name: "Premium status", value: "premium" },
            { name: "Entitlements", value: "entitlements" },
          ],
        },
        {
          type: CommandOptionType.STRING,
          name: "duration",
          description: "The duration of the test alarm (in seconds)",
          required: false,
        },
        {
          type: CommandOptionType.INTEGER,
          name: "winners",
          description: "Number of winners to draw",
          required: false,
          min_value: 1,
        },
        {
          type: CommandOptionType.STRING,
          name: "id",
          description: "The Durable Object ID of the giveaway",
          required: false,
        },
        {
          type: CommandOptionType.INTEGER,
          name: "entries",
          description: "Number of test entries to generate (default: 10)",
          required: false,
          min_value: 1,
          max_value: 10000,
        },
        {
          type: CommandOptionType.STRING,
          name: "scope",
          description: "Entitlement scope (guild/user/both)",
          required: false,
          choices: [
            { name: "Guild", value: "guild" },
            { name: "User", value: "user" },
            { name: "Both", value: "both" },
          ],
        },
        {
          type: CommandOptionType.INTEGER,
          name: "limit",
          description: "Max entitlement rows (default: 10)",
          required: false,
          min_value: 1,
          max_value: 25,
        },
      ],
    });
  }

  private async ensureAllowed(ctx: CommandContext): Promise<boolean> {
    const devGuild = getContext().env?.DEVELOPMENT_GUILD;

    if (!ctx.guildID || !devGuild || ctx.guildID !== devGuild) {
      await ctx.send({
        content: await getContext().i18n.translate(
          "commands.debug.errors.not_allowed",
          { language: ctx.locale }
        ),
        ephemeral: true,
      });

      return false;
    }

    return true;
  }

  async run(ctx: CommandContext) {
    if (!(await this.ensureAllowed(ctx))) {
      return;
    }

    const action = (ctx.options.action ?? "savestate_full") as DebugAction;

    Sentry.addBreadcrumb({
      category: "debug",
      message: "debug command invoked",
      level: "info",
      data: {
        action,
        guildId: ctx.guildID ?? null,
        userId: ctx.user.id,
      },
    });

    try {
      await ctx.defer();

      switch (action) {
        case "savestate_full":
          return this.handleFullTest(ctx);
        case "savestate_alarm":
          return this.handleAlarmTest(ctx);
        case "savestate_info":
          return this.handleInfoTest(ctx);
        case "premium":
          return this.handlePremiumStatus(ctx);
        case "entitlements":
          return this.handleEntitlements(ctx);
        default:
          return ctx.editOriginal(
            await getContext().i18n.translate(
              "commands.debug.errors.unknown_action",
              {
                language: ctx.locale,
              }
            )
          );
      }
    } catch (error) {
      Sentry.captureException(error);
      console.error("Debug command failed:", error);

      return ctx.editOriginal(
        await getContext().i18n.translate("common.errors.unexpected", {
          language: ctx.locale,
        })
      );
    }
  }

  private async handleFullTest(ctx: CommandContext) {
    if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
      const errorMessage = await getContext().i18n.translate(
        "common.errors.giveaway_state_unavailable",
        {
          language: ctx.locale,
        }
      );
      return ctx.editOriginal(errorMessage);
    }

    const id = getContext().env.GIVEAWAY_STATE.newUniqueId();
    const stub = getContext().state.getInstance(
      getContext().env.GIVEAWAY_STATE,
      id
    );
    const durationSeconds = parseInt(ctx.options.duration ?? "60", 10);
    const duration = durationSeconds * 1000;
    const endTime = new Date(Date.now() + duration);
    const winnersCount = ctx.options.winners ?? 1;

    const message = (await ctx.send(
      await getContext().i18n.translate(
        "commands.debug.messages.starting_full_test",
        {
          language: ctx.locale,
        }
      )
    )) as unknown as Message;

    // Step 1: Begin the giveaway
    const giveawayResult = await stub.beginGiveaway.mutate({
      message_id: message.id,
      channel_id: ctx.channelID ?? "0",
      guild_id: ctx.guildID ?? "0",
      prize: "Test Giveaway Prize",
      winners: winnersCount,
      end_time: endTime.toISOString(),
      host_id: ctx.user.id,
    });

    // Step 2: Start the alarm
    const alarmResult = await stub.startAlarm.mutate(endTime.toISOString());

    Sentry.addBreadcrumb({
      category: "debug.savestate",
      message: "full test started",
      level: "info",
      data: {
        giveawayResult,
        alarmResult,
        durableObjectId: id.toString(),
        durationSeconds,
        winnersCount,
      },
    });

    // Step 3: Generate test entries
    const entryCount = ctx.options.entries ?? 10;

    // Add the command user as an entry
    const commandUser = {
      user_id: ctx.user.id,
      username: ctx.user.username,
      discriminator: ctx.user.discriminator,
      avatar: ctx.user.avatar || null,
    };
    await stub.addEntry.mutate(commandUser);

    // Generate fake users for remaining entries
    for (let i = 1; i < entryCount; i++) {
      const paddedId = i.toString().padStart(18, "0");
      await stub.addEntry.mutate({
        user_id: paddedId,
        username: `TestUser${i}`,
        discriminator: i.toString().padStart(4, "0"),
        avatar: null,
      });
    }

    // Fetch current state
    const state = await stub.getState.query();
    const entries = await stub.getEntries.query();

    return ctx.editOriginal({
      content: await getContext().i18n.translate(
        "commands.debug.messages.full_test_started",
        {
          language: ctx.locale,
          params: {
            prize: "Test Giveaway Prize",
            winners: winnersCount.toString(),
            duration: durationSeconds.toString(),
            entries: entries.length.toString(),
            status: state.state,
            id: id.toString(),
            endTime: endTime.toLocaleString(),
          },
        }
      ),
      components: [JoinButton.createActionRow(id.toString())],
    });
  }

  private async handleAlarmTest(ctx: CommandContext) {
    if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
      const errorMessage = await getContext().i18n.translate(
        "common.errors.giveaway_state_unavailable",
        {
          language: ctx.locale,
        }
      );
      return ctx.editOriginal(errorMessage);
    }

    const id = getContext().env.GIVEAWAY_STATE.newUniqueId();
    const stub = getContext().state.getInstance(
      getContext().env.GIVEAWAY_STATE,
      id
    );
    const duration = parseInt(ctx.options.duration ?? "60", 10) * 1000;
    const endTime = new Date(Date.now() + duration);

    const output = await stub.startAlarm.mutate(endTime.toISOString());

    Sentry.addBreadcrumb({
      category: "debug.savestate",
      message: "alarm test started",
      level: "info",
      data: {
        durableObjectId: id.toString(),
        output,
        durationSeconds: duration / 1000,
      },
    });

    return ctx.editOriginal(
      await getContext().i18n.translate(
        "commands.debug.messages.alarm_started",
        {
          language: ctx.locale,
          params: {
            duration: (duration / 1000).toString(),
            id: id.toString(),
          },
        }
      )
    );
  }

  private async handleInfoTest(ctx: CommandContext) {
    if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
      const errorMessage = await getContext().i18n.translate(
        "common.errors.giveaway_state_unavailable",
        {
          language: ctx.locale,
        }
      );
      return ctx.editOriginal(errorMessage);
    }

    const objectIdStr = ctx.options.id;

    if (!objectIdStr) {
      return ctx.editOriginal(
        await getContext().i18n.translate(
          "commands.debug.errors.missing_object_id",
          {
            language: ctx.locale,
          }
        )
      );
    }

    const stub = getContext().state.getInstance(
      getContext().env.GIVEAWAY_STATE,
      getContext().env.GIVEAWAY_STATE.idFromString(objectIdStr)
    );

    const state = await stub.getState.query();

    if (!state) {
      return ctx.editOriginal(
        await getContext().i18n.translate("common.errors.giveaway_not_found", {
          language: ctx.locale,
        })
      );
    }

    const entries = await stub.getEntries.query();

    const endTime = new Date(state.endTime);
    const now = new Date();
    const remaining = Math.max(0, endTime.getTime() - now.getTime());
    const remainingMinutes = Math.floor(remaining / 60000);
    const remainingSeconds = Math.floor((remaining % 60000) / 1000);

    const entriesList =
      entries.length > 0
        ? (await getContext().i18n.translate(
            "commands.debug.messages.entries_header",
            {
              language: ctx.locale,
            }
          )) +
          "\n" +
          entries
            .slice(0, 5)
            .map((e) => `- ${e.username}#${e.discriminator}`)
            .join("\n") +
          (entries.length > 5
            ? `\n${await getContext().i18n.translate(
                "commands.debug.messages.and_more",
                {
                  language: ctx.locale,
                  params: { count: (entries.length - 5).toString() },
                }
              )}`
            : "")
        : await getContext().i18n.translate(
            "commands.debug.messages.no_entries",
            {
              language: ctx.locale,
            }
          );

    return ctx.editOriginal(
      await getContext().i18n.translate(
        "commands.debug.messages.giveaway_info",
        {
          language: ctx.locale,
          params: {
            prize: state.prize,
            winners: state.winners.toString(),
            entries: entries.length.toString(),
            status: state.state,
            endTime: endTime.toLocaleString(),
            remaining: `${remainingMinutes}m ${remainingSeconds}s`,
            id: objectIdStr,
            entriesList,
          },
        }
      )
    );
  }

  private async handlePremiumStatus(ctx: CommandContext) {
    if (!getContext().drizzle) {
      return ctx.editOriginal(
        await getContext().i18n.translate(
          "common.errors.database_unavailable",
          {
            language: ctx.locale,
          }
        )
      );
    }

    const subscription = await this.getPremiumStatus(ctx);

    return ctx.editOriginal(
      await getContext().i18n.translate(
        "commands.debug.messages.premium_status",
        {
          language: ctx.locale,
          params: {
            hasPremium: subscription.hasPremium ? "true" : "false",
            source: subscription.source,
            isLifetime: subscription.isLifetime ? "true" : "false",
            expiresAt: subscription.expiresAt ?? "(null)",
            entitlementType:
              subscription.entitlementType?.toString() ?? "(null)",
            entitlementId: subscription.entitlementId ?? "(null)",
            skuId: subscription.skuId ?? "(null)",
            isTest: subscription.isTest ? "true" : "false",
          },
        }
      )
    );
  }

  private async handleEntitlements(ctx: CommandContext) {
    if (!getContext().drizzle) {
      return ctx.editOriginal(
        await getContext().i18n.translate(
          "common.errors.database_unavailable",
          {
            language: ctx.locale,
          }
        )
      );
    }

    const scope = (ctx.options.scope ?? "guild") as EntitlementScope;
    const limit = (ctx.options.limit ?? 10) as number;

    const guildCondition = ctx.guildID
      ? eq(Schema.entitlements.guildId, ctx.guildID)
      : null;
    const userCondition = eq(Schema.entitlements.userId, ctx.user.id);

    const condition = (() => {
      switch (scope) {
        case "guild":
          return guildCondition;
        case "user":
          return userCondition;
        case "both":
          if (guildCondition) return or(guildCondition, userCondition);
          return userCondition;
        default:
          return null;
      }
    })();

    if (!condition) {
      return ctx.editOriginal(
        await getContext().i18n.translate(
          "commands.debug.errors.no_entitlement_scope",
          {
            language: ctx.locale,
          }
        )
      );
    }

    const rows = await getContext()
      .drizzle.select()
      .from(Schema.entitlements)
      .where(condition)
      .orderBy(desc(Schema.entitlements.updatedAt))
      .limit(limit);

    const formatted = rows
      .map((row) => {
        const parts = [
          `id=${row.id}`,
          `type=${row.type}`,
          `skuId=${row.skuId}`,
          `guildId=${row.guildId ?? "(null)"}`,
          `userId=${row.userId ?? "(null)"}`,
          `deleted=${row.deleted ? "true" : "false"}`,
          `consumed=${row.consumed ? "true" : "false"}`,
          `startsAt=${row.startsAt}`,
          `endsAt=${row.endsAt ?? "(null)"}`,
        ];

        return `- ${parts.join(" ")}`;
      })
      .join("\n");

    return ctx.editOriginal({
      content: await getContext().i18n.translate(
        "commands.debug.messages.entitlements",
        {
          language: ctx.locale,
          params: {
            count: rows.length.toString(),
            scope,
            rows: formatted || "(none)",
          },
        }
      ),
    });
  }
}
