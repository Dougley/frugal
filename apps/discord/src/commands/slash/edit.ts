import { EditModal } from "@dougley/frugal-utils";
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
import { getEditModalTranslations } from "../../utils/giveaway-translations";

export default class EditCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "edit",
      description: "Edit a giveaway",
      contexts: [InteractionContextType.GUILD],
      requiredPermissions: ["MANAGE_EVENTS"],
      options: [
        {
          type: CommandOptionType.STRING,
          name: "id",
          description: "ID of the giveaway to edit",
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
    try {
      if (!ctx.guildID) {
        return ctx.send({
          content: await getContext().i18n.translate(
            "common.errors.guild_only",
            {
              language: ctx.locale,
            }
          ),
          ephemeral: true,
        });
      }

      if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
        return ctx.send({
          content: await getContext().i18n.translate(
            "common.errors.giveaway_state_unavailable",
            { language: ctx.locale }
          ),
          ephemeral: true,
        });
      }

      const giveawayId = ctx.options.id;
      if (!isValidGiveawayId(giveawayId)) {
        return ctx.send({
          content: await getContext().i18n.translate(
            "common.errors.invalid_giveaway_id",
            { language: ctx.locale }
          ),
          ephemeral: true,
        });
      }

      const stub = getContext().state.getInstance(
        getContext().env.GIVEAWAY_STATE,
        getContext().env.GIVEAWAY_STATE.idFromString(giveawayId)
      );

      const state = await stub.getState.query();

      if (!canManageGiveaway(ctx, { hostId: state?.hostId })) {
        return ctx.send({
          content: await getContext().i18n.translate(
            "common.errors.manage_giveaway_denied",
            { language: ctx.locale }
          ),
          ephemeral: true,
        });
      }

      if (!state) {
        return ctx.send({
          content: await getContext().i18n.translate(
            "common.errors.giveaway_not_found",
            { language: ctx.locale }
          ),
          ephemeral: true,
        });
      }

      if (state.state !== "OPEN") {
        return ctx.send({
          content: await getContext().i18n.translate(
            "components.edit_modal.errors.not_open",
            { language: ctx.locale }
          ),
          ephemeral: true,
        });
      }

      const translations = await getEditModalTranslations(
        ctx.locale ?? "en-US"
      );
      return ctx.sendModal(
        EditModal.createModal(giveawayId, state, translations)
      );
    } catch (error) {
      console.error("Error in edit command:", error);
      Sentry.captureException(error);

      return ctx.send({
        content: await getContext().i18n.translate("common.errors.unexpected", {
          language: ctx.locale,
        }),
        ephemeral: true,
      });
    }
  }
}
