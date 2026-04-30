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
import { createGiveawayStatusResponse } from "../../utils/giveaway-status";

export default class GiveawayCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "giveaway",
      description: "Giveaway commands",
      contexts: [InteractionContextType.GUILD],
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "info",
          description: "View info and your entry status for a giveaway",
          options: [
            {
              type: CommandOptionType.STRING,
              name: "id",
              description: "ID of the giveaway",
              required: true,
              autocomplete: true,
            },
          ],
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

      const giveawayId = ctx.options.info?.id as string | undefined;
      if (!giveawayId || !isValidGiveawayId(giveawayId)) {
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

      const [state, firstPage] = await Promise.all([
        stub.getState.query(),
        stub.getEntriesPaginated.query({ page: 1, limit: 100 }),
      ]);

      if (!state) {
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "common.errors.giveaway_not_found",
            { language: ctx.locale }
          )
        );
      }

      return ctx.editOriginal(
        await createGiveawayStatusResponse({
          giveawayId,
          locale: ctx.locale,
          state,
          userId: ctx.user.id,
          entries: firstPage.entries,
          totalEntries: firstPage.total,
        })
      );
    } catch (error) {
      console.error("Error in giveaway info command:", error);
      Sentry.captureException(error);

      return ctx.editOriginal(
        await getContext().i18n.translate("common.errors.unexpected", {
          language: ctx.locale,
        })
      );
    }
  }
}
