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
    await ctx.defer();

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
          {
            language: ctx.locale,
          }
        );
        return ctx.editOriginal(errorMessage);
      }

      const giveawayId = ctx.options.id;
      if (!isValidGiveawayId(giveawayId)) {
        const errorMessage = await getContext().i18n.translate(
          "components.join_button.errors.invalid_id",
          {
            language: ctx.locale,
          }
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

      if (state.state !== "OPEN") {
        const errorMessage = await getContext().i18n.translate(
          "commands.stop.errors.not_running",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      if (!canManageGiveaway(ctx, state)) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.manage_giveaway_denied",
          { language: ctx.locale }
        );
        return ctx.editOriginal(errorMessage);
      }

      await stub.endGiveaway.mutate();

      const successMessage = await getContext().i18n.translate(
        "commands.stop.messages.success",
        { language: ctx.locale, params: { prize: state.prize } }
      );
      return ctx.editOriginal(successMessage);
    } catch (error) {
      console.error("Error in stop command:", error);
      Sentry.captureException(error);

      const errorMessage = await getContext().i18n.translate(
        "commands.stop.errors.failed",
        { language: ctx.locale }
      );
      return ctx.editOriginal(errorMessage);
    }
  }
}
