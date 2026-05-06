import { eq, sql } from "@dougley/frugal-drizzle/workers";
import * as Schema from "@dougley/frugal-drizzle/workers/schema.js";
import * as Sentry from "@sentry/cloudflare";
import {
  type CommandContext,
  CommandOptionType,
  InteractionContextType,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";

const HEX_RE = /^#?([0-9a-fA-F]{6})$/;

export default class SettingsCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "settings",
      description: "View or update server giveaway settings",
      contexts: [InteractionContextType.GUILD],
      requiredPermissions: ["MANAGE_EVENTS"],
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "view",
          description: "Show current server settings",
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "set-ping-role",
          description: "Set the role mentioned when a giveaway starts",
          options: [
            {
              type: CommandOptionType.ROLE,
              name: "role",
              description: "The Discord role",
              required: true,
            },
          ],
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "set-color",
          description: "Set the embed accent color (hex code)",
          options: [
            {
              type: CommandOptionType.STRING,
              name: "color",
              description: "Hex color code (e.g. #4c6ef5)",
              required: true,
            },
          ],
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "set-required-roles",
          description: "Set the roles required to enter giveaways",
          options: [
            {
              type: CommandOptionType.ROLE,
              name: "role",
              description: "A role required to enter giveaways",
              required: true,
            },
          ],
        },
      ],
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

      if (sub === "view") {
        const row = await drizzle.query.guildSettings.findFirst({
          where: eq(Schema.guildSettings.guildId, guildId),
        });

        const [
          titleText,
          pingRoleLabel,
          accentColorLabel,
          requiredRolesLabel,
          defaultChannelLabel,
          noneLabel,
        ] = await Promise.all([
          getContext().i18n.translate("commands.settings.messages.title", {
            language: ctx.locale,
          }),
          getContext().i18n.translate("commands.settings.messages.ping_role", {
            language: ctx.locale,
          }),
          getContext().i18n.translate(
            "commands.settings.messages.accent_color",
            { language: ctx.locale }
          ),
          getContext().i18n.translate(
            "commands.settings.messages.required_roles",
            { language: ctx.locale }
          ),
          getContext().i18n.translate(
            "commands.settings.messages.default_channel",
            { language: ctx.locale }
          ),
          getContext().i18n.translate("commands.settings.messages.none", {
            language: ctx.locale,
          }),
        ]);

        const defaultChannel = row?.defaultChannelId
          ? `<#${row.defaultChannelId}>`
          : noneLabel;
        const pingRole = row?.pingRoleId
          ? `<@&${row.pingRoleId}>`
          : "@here (default)";
        const color = row?.accentColor ?? "#4c6ef5";
        const requiredRoles = row?.requiredRoles?.length
          ? row.requiredRoles.map((id) => `<@&${id}>`).join(" ")
          : noneLabel;

        return ctx.editOriginal(
          `## ${titleText}\n\n**${defaultChannelLabel}:** ${defaultChannel}\n**${pingRoleLabel}:** ${pingRole}\n**${accentColorLabel}:** \`${color}\`\n**${requiredRolesLabel}:** ${requiredRoles}`
        );
      }

      if (sub === "set-ping-role") {
        const roleId = ctx.options["set-ping-role"].role as string;
        await upsertSettings(drizzle, guildId, { pingRoleId: roleId });
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "commands.settings.messages.updated",
            { language: ctx.locale }
          )
        );
      }

      if (sub === "set-color") {
        const raw = ctx.options["set-color"].color as string;
        const match = HEX_RE.exec(raw);
        if (!match) {
          return ctx.editOriginal(
            await getContext().i18n.translate(
              "commands.settings.messages.invalid_color",
              { language: ctx.locale }
            )
          );
        }
        const color = `#${match[1].toLowerCase()}`;
        await upsertSettings(drizzle, guildId, { accentColor: color });
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "commands.settings.messages.updated",
            { language: ctx.locale }
          )
        );
      }

      if (sub === "set-required-roles") {
        const roleId = ctx.options["set-required-roles"].role as string;
        // Fetch current settings to append to existing required roles list
        const current = await drizzle.query.guildSettings.findFirst({
          where: eq(Schema.guildSettings.guildId, guildId),
        });
        const currentRoles = current?.requiredRoles ?? [];
        if (!currentRoles.includes(roleId)) {
          currentRoles.push(roleId);
        }
        await upsertSettings(drizzle, guildId, {
          requiredRoles: currentRoles,
        });
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "commands.settings.messages.updated",
            { language: ctx.locale }
          )
        );
      }

      return ctx.editOriginal(
        await getContext().i18n.translate("common.errors.unexpected", {
          language: ctx.locale,
        })
      );
    } catch (error) {
      console.error("Error in settings command:", error);
      Sentry.captureException(error);
      return ctx.editOriginal(
        await getContext().i18n.translate("common.errors.unexpected", {
          language: ctx.locale,
        })
      );
    }
  }
}

async function upsertSettings(
  drizzle: ReturnType<
    typeof import("@dougley/frugal-drizzle/workers").drizzleD1
  >,
  guildId: string,
  patch: Partial<typeof Schema.guildSettings.$inferInsert>
) {
  await drizzle
    .insert(Schema.guildSettings)
    .values({ guildId, ...patch })
    .onConflictDoUpdate({
      target: Schema.guildSettings.guildId,
      set: { ...patch, updatedAt: sql`CURRENT_TIMESTAMP` },
    });
}
