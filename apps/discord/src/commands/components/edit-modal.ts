import { TRPCClientError } from "@dougley/frugal-savestate";
import { FEATURE_LIMITS } from "@dougley/frugal-subscriptions";
import { EditModal } from "@dougley/frugal-utils";
import * as Sentry from "@sentry/cloudflare";
import type {
  ComponentContext,
  ModalInteractionContext,
} from "slash-create/web";
import { getContext } from "../../context";
import { isValidGiveawayId } from "../../utils/giveaway-autocomplete";
import { canManageGiveaway } from "../../utils/giveaway-permissions";
import { getEditModalTranslations } from "../../utils/giveaway-translations";

export const button_id_regex = EditModal.button_id_regex;
export const modal_id_regex = EditModal.modal_id_regex;

export async function handleButtonInteraction(ctx: ComponentContext) {
  const { env, state, i18n } = getContext();
  const locale = ctx.locale || "en-US";

  try {
    const giveawayId = ctx.customID.split(":")[1];
    if (!isValidGiveawayId(giveawayId)) {
      return ctx.send({
        content: await i18n.translate("common.errors.invalid_giveaway_id", {
          language: locale,
        }),
        ephemeral: true,
      });
    }

    if (!env?.GIVEAWAY_STATE || !state) {
      return ctx.send({
        content: await i18n.translate(
          "common.errors.giveaway_state_unavailable",
          {
            language: locale,
          }
        ),
        ephemeral: true,
      });
    }

    const stub = state.getInstance(
      env.GIVEAWAY_STATE,
      env.GIVEAWAY_STATE.idFromString(giveawayId)
    );

    const instance = await stub.getState.query();

    if (!instance) {
      return ctx.send({
        content: await i18n.translate("common.errors.giveaway_not_found", {
          language: locale,
        }),
        ephemeral: true,
      });
    }

    if (instance.state !== "OPEN") {
      return ctx.send({
        content: await i18n.translate("components.edit_modal.errors.not_open", {
          language: locale,
        }),
        ephemeral: true,
      });
    }

    if (!canManageGiveaway(ctx, instance)) {
      return ctx.send({
        content: await i18n.translate("common.errors.manage_giveaway_denied", {
          language: locale,
        }),
        ephemeral: true,
      });
    }

    const translations = await getEditModalTranslations(locale);
    return ctx.sendModal(
      EditModal.createModal(giveawayId, instance, translations)
    );
  } catch (error) {
    console.error("Error opening edit modal:", error);
    Sentry.captureException(error);

    return ctx.send({
      content: await i18n.translate("common.errors.unexpected", {
        language: locale,
      }),
      ephemeral: true,
    });
  }
}

export async function handleModalSubmit(ctx: ModalInteractionContext) {
  const { env, state, i18n } = getContext();
  const locale = ctx.locale || "en-US";

  const match = ctx.customID.match(EditModal.modal_id_regex);
  if (!match) {
    return ctx.send({
      content: await i18n.translate(
        "components.edit_modal.errors.invalid_submission",
        {
          language: locale,
        }
      ),
      ephemeral: true,
    });
  }

  const giveawayId = match[1];
  if (!isValidGiveawayId(giveawayId)) {
    return ctx.send({
      content: await i18n.translate("common.errors.invalid_giveaway_id", {
        language: locale,
      }),
      ephemeral: true,
    });
  }

  if (!env?.GIVEAWAY_STATE || !state) {
    return ctx.send({
      content: await i18n.translate(
        "common.errors.giveaway_state_unavailable",
        {
          language: locale,
        }
      ),
      ephemeral: true,
    });
  }

  const stub = state.getInstance(
    env.GIVEAWAY_STATE,
    env.GIVEAWAY_STATE.idFromString(giveawayId)
  );

  const instance = await stub.getState.query();
  if (!instance) {
    return ctx.send({
      content: await i18n.translate("common.errors.giveaway_not_found", {
        language: locale,
      }),
      ephemeral: true,
    });
  }

  if (instance.state !== "OPEN") {
    return ctx.send({
      content: await i18n.translate("components.edit_modal.errors.not_open", {
        language: locale,
      }),
      ephemeral: true,
    });
  }

  if (!canManageGiveaway(ctx, instance)) {
    return ctx.send({
      content: await i18n.translate("common.errors.manage_giveaway_denied", {
        language: locale,
      }),
      ephemeral: true,
    });
  }

  const prize = (
    Array.isArray(ctx.values.prize) ? ctx.values.prize[0] : ctx.values.prize
  ) as string | undefined;
  const winnersStr = (
    Array.isArray(ctx.values.winners)
      ? ctx.values.winners[0]
      : ctx.values.winners
  ) as string | undefined;
  const description = (
    Array.isArray(ctx.values.description)
      ? ctx.values.description[0]
      : ctx.values.description
  ) as string | undefined;

  if (!prize || !winnersStr || prize.length < 1 || winnersStr.length < 1) {
    return ctx.send({
      content: await i18n.translate(
        "components.edit_modal.errors.required_fields",
        {
          language: locale,
        }
      ),
      ephemeral: true,
    });
  }

  const winners = parseInt(winnersStr, 10);
  if (
    Number.isNaN(winners) ||
    winners < 1 ||
    winners > FEATURE_LIMITS.MAX_WINNERS.PREMIUM
  ) {
    return ctx.send({
      content: await i18n.translate(
        "components.edit_modal.errors.invalid_winners",
        {
          language: locale,
        }
      ),
      ephemeral: true,
    });
  }

  try {
    await stub.updateGiveaway.mutate({
      prize: prize || "",
      winners,
      description: description || undefined,
    });

    return ctx.send({
      content: await i18n.translate("components.edit_modal.messages.success", {
        language: locale,
      }),
      ephemeral: true,
    });
  } catch (error) {
    if (
      error instanceof TRPCClientError &&
      error.data?.code === "FORBIDDEN" &&
      error.message === "PREMIUM_WINNERS_LIMIT"
    ) {
      return ctx.send({
        content: await i18n.translate("premium.upsell.more_winners", {
          language: locale,
          params: {
            premiumMax: FEATURE_LIMITS.MAX_WINNERS.PREMIUM.toString(),
          },
        }),
        ephemeral: true,
      });
    }

    console.error("Error updating giveaway:", error);
    Sentry.captureException(error);
    return ctx.send({
      content: await i18n.translate(
        "components.edit_modal.errors.update_failed",
        {
          language: locale,
          params: {
            error: error instanceof Error ? error.message : String(error),
          },
        }
      ),
      ephemeral: true,
    });
  }
}
