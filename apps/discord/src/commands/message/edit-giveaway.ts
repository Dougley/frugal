import { and, eq, Schema } from "@dougley/frugal-drizzle/workers";
import { EditModal } from "@dougley/frugal-utils";
import * as Sentry from "@sentry/cloudflare";
import {
  ApplicationCommandType,
  type CommandContext,
  InteractionContextType,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";
import { canManageGiveaway } from "../../utils/giveaway-permissions";
import { getEditModalTranslations } from "../../utils/giveaway-translations";

export default class EditGiveawayCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      type: ApplicationCommandType.MESSAGE,
      name: "edit_giveaway",
      contexts: [InteractionContextType.GUILD],
      requiredPermissions: ["MANAGE_EVENTS"],
    });
  }

  async run(ctx: CommandContext) {
    try {
      if (!ctx.guildID) {
        return ctx.send({
          content: await getContext().i18n.translate(
            "common.errors.guild_only",
            { language: ctx.locale }
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

      if (!getContext().env?.D1 || !getContext().drizzle) {
        return ctx.send({
          content: await getContext().i18n.translate(
            "common.errors.database_unavailable",
            { language: ctx.locale }
          ),
          ephemeral: true,
        });
      }

      const targetMessage = ctx.targetMessage;
      if (!targetMessage) {
        return ctx.send({
          content: await getContext().i18n.translate(
            "common.errors.not_giveaway_message",
            { language: ctx.locale }
          ),
          ephemeral: true,
        });
      }

      const giveaway = await getContext()
        .drizzle.select({
          durableObjectId: Schema.giveaways.durableObjectId,
        })
        .from(Schema.giveaways)
        .where(
          and(
            eq(Schema.giveaways.guildId, ctx.guildID),
            eq(Schema.giveaways.channelId, targetMessage.channelID),
            eq(Schema.giveaways.messageId, targetMessage.id)
          )
        )
        .get();

      if (!giveaway) {
        return ctx.send({
          content: await getContext().i18n.translate(
            "common.errors.not_giveaway_message",
            { language: ctx.locale }
          ),
          ephemeral: true,
        });
      }

      const stub = getContext().state.getInstance(
        getContext().env.GIVEAWAY_STATE,
        getContext().env.GIVEAWAY_STATE.idFromString(giveaway.durableObjectId)
      );

      const state = await stub.getState.query();

      if (!state) {
        return ctx.send({
          content: await getContext().i18n.translate(
            "common.errors.giveaway_not_found",
            { language: ctx.locale }
          ),
          ephemeral: true,
        });
      }

      if (!canManageGiveaway(ctx, state)) {
        return ctx.send({
          content: await getContext().i18n.translate(
            "common.errors.manage_giveaway_denied",
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
        EditModal.createModal(giveaway.durableObjectId, state, translations)
      );
    } catch (error) {
      console.error("Error in edit_giveaway command:", error);
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
