import { EditModal, type EditModalTranslations } from "@dougley/frugal-utils";
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

/**
 * Helper to get edit modal translations from i18n
 */
async function getEditModalTranslations(
  locale: string
): Promise<EditModalTranslations> {
  const { i18n } = getContext();
  const [buttonLabel, modalTitle, prizeLabel, winnersLabel, descriptionLabel] =
    await Promise.all([
      i18n.translate("components.edit_modal.button_label", {
        language: locale,
      }),
      i18n.translate("components.edit_modal.title", { language: locale }),
      i18n.translate("components.edit_modal.fields.prize", {
        language: locale,
      }),
      i18n.translate("components.edit_modal.fields.winners", {
        language: locale,
      }),
      i18n.translate("components.edit_modal.fields.description", {
        language: locale,
      }),
    ]);

  return {
    buttonLabel,
    modalTitle,
    prizeLabel,
    winnersLabel,
    descriptionLabel,
  };
}

export default class EditCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "edit",
      description: "Edit a giveaway",
      contexts: [InteractionContextType.GUILD],
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
    // No need to defer the response as we're showing a modal immediately
    try {
      if (!ctx.guildID) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.guild_only",
          { language: ctx.locale }
        );
        return ctx.send({
          content: errorMessage,
          ephemeral: true,
        });
      }

      if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.giveaway_state_unavailable",
          {
            language: ctx.locale,
          }
        );
        return ctx.send({
          content: errorMessage,
          ephemeral: true,
        });
      }

      const giveawayId = ctx.options.id;
      if (!isValidGiveawayId(giveawayId)) {
        const errorMessage = await getContext().i18n.translate(
          "components.join_button.errors.invalid_id",
          {
            language: ctx.locale,
          }
        );
        return ctx.send({
          content: errorMessage,
          ephemeral: true,
        });
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
        return ctx.send({
          content: errorMessage,
          ephemeral: true,
        });
      }

      if (state.state !== "OPEN") {
        const errorMessage = await getContext().i18n.translate(
          "components.edit_modal.errors.not_open",
          { language: ctx.locale }
        );
        return ctx.send({
          content: errorMessage,
          ephemeral: true,
        });
      }

      if (!canManageGiveaway(ctx, state)) {
        const errorMessage = await getContext().i18n.translate(
          "common.errors.manage_giveaway_denied",
          { language: ctx.locale }
        );
        return ctx.send({
          content: errorMessage,
          ephemeral: true,
        });
      }

      // Show the modal immediately using the component's createModal method
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
