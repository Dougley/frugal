import * as Sentry from "@sentry/cloudflare";
import {
  type AutocompleteContext,
  type CommandContext,
  CommandOptionType,
  InteractionContextType,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";
import {
  getGiveawayAutocompleteChoices,
  isValidGiveawayId,
} from "../../utils/giveaway-autocomplete";
import { canManageGiveaway } from "../../utils/giveaway-permissions";

export default class StopCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "stop",
      description: "Stop a running giveaway",
      contexts: [InteractionContextType.GUILD],
      requiredPermissions: ["MANAGE_EVENTS"],
      options: [
        {
          type: CommandOptionType.STRING,
          name: "id",
          description: "ID of the giveaway to stop",
          required: true,
          autocomplete: true,
        },
      ],
    });
  }

  async autocomplete(ctx: AutocompleteContext) {
    return getGiveawayAutocompleteChoices({
      guildId: ctx.guildID,
      locale: ctx.locale,
      state: "OPEN",
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

      const giveawayId = ctx.options.id;
      if (!isValidGiveawayId(giveawayId)) {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "common.errors.invalid_giveaway_id",
            { language: ctx.locale }
          )
        );
      }

      const stub = getContext().state.getInstance(
        getContext().env.GIVEAWAY_STATE,
        getContext().env.GIVEAWAY_STATE.idFromString(giveawayId)
      );

      const state = await stub.getState.query();

      if (!canManageGiveaway(ctx, { hostId: state?.hostId })) {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "common.errors.manage_giveaway_denied",
            { language: ctx.locale }
          )
        );
      }

      if (!state) {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "common.errors.giveaway_not_found",
            {
              language: ctx.locale,
            }
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
      console.error("Error in stop command:", error);
      Sentry.captureException(error);

      return ctx.editOriginal(
        await getContext().i18n.translate("commands.stop.errors.failed", {
          language: ctx.locale,
        })
      );
    }
  }
}
