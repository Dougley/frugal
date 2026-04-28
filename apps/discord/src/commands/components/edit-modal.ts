import type { SubscriptionStatus } from "@dougley/frugal-subscriptions";
import {
  checkFeatureLimit,
  FEATURE_LIMITS,
  getPremiumStatus,
} from "@dougley/frugal-subscriptions";
import { EditModal, type EditModalTranslations } from "@dougley/frugal-utils";
import * as Sentry from "@sentry/cloudflare";
import type {
  ComponentContext,
  ModalInteractionContext,
} from "slash-create/web";
import { getContext } from "../../context";
import { isValidGiveawayId } from "../../utils/giveaway-autocomplete";
import { canManageGiveaway } from "../../utils/giveaway-permissions";

// Export the patterns and methods for commands/index.ts
export const button_id_regex = EditModal.button_id_regex;
export const modal_id_regex = EditModal.modal_id_regex;

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

/**
 * Handles the button click to open the edit modal
 * @param ctx The component context
 */
export async function handleButtonInteraction(ctx: ComponentContext) {
  try {
    // Extract giveaway ID from button custom_id
    const giveawayId = ctx.customID.split(":")[1];
    if (!isValidGiveawayId(giveawayId)) {
      return ctx.send({
        content: await getContext().i18n.translate(
          "components.join_button.errors.invalid_id",
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
          {
            language: ctx.locale,
          }
        ),
        ephemeral: true,
      });
    }

    const stub = getContext().state.getInstance(
      getContext().env.GIVEAWAY_STATE,
      getContext().env.GIVEAWAY_STATE.idFromString(giveawayId)
    );

    const state = await stub.getState.query();

    if (!state) {
      return ctx.send({
        content: await getContext().i18n.translate(
          "common.errors.giveaway_not_found",
          {
            language: ctx.locale,
          }
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

    if (!canManageGiveaway(ctx, state)) {
      return ctx.send({
        content: await getContext().i18n.translate(
          "common.errors.manage_giveaway_denied",
          { language: ctx.locale }
        ),
        ephemeral: true,
      });
    }

    // Show the modal with pre-filled current values
    const translations = await getEditModalTranslations(ctx.locale ?? "en-US");
    return ctx.sendModal(
      EditModal.createModal(giveawayId, state, translations)
    );
  } catch (error) {
    console.error("Error opening edit modal:", error);
    Sentry.captureException(error);

    return ctx.send({
      content: await getContext().i18n.translate("common.errors.unexpected", {
        language: ctx.locale,
      }),
      ephemeral: true,
    });
  }
}

/**
 * Handles the modal submission
 * @param ctx The modal response context
 */
export async function handleModalSubmit(ctx: ModalInteractionContext) {
  // Extract giveaway ID from modal custom_id
  const match = ctx.customID.match(EditModal.modal_id_regex);
  if (!match) {
    return ctx.send({
      content: await getContext().i18n.translate(
        "components.edit_modal.errors.invalid_submission",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  }

  const giveawayId = match[1];
  if (!isValidGiveawayId(giveawayId)) {
    return ctx.send({
      content: await getContext().i18n.translate(
        "components.join_button.errors.invalid_id",
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
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  }

  const stub = getContext().state.getInstance(
    getContext().env.GIVEAWAY_STATE,
    getContext().env.GIVEAWAY_STATE.idFromString(giveawayId)
  );

  // Get the current state
  const state = await stub.getState.query();
  if (!state) {
    return ctx.send({
      content: await getContext().i18n.translate(
        "common.errors.giveaway_not_found",
        {
          language: ctx.locale,
        }
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

  if (!canManageGiveaway(ctx, state)) {
    return ctx.send({
      content: await getContext().i18n.translate(
        "common.errors.manage_giveaway_denied",
        { language: ctx.locale }
      ),
      ephemeral: true,
    });
  }

  const prize = Array.isArray(ctx.values.prize)
    ? ctx.values.prize[0]
    : ctx.values.prize;
  const winnersStr = Array.isArray(ctx.values.winners)
    ? ctx.values.winners[0]
    : ctx.values.winners;
  const description = Array.isArray(ctx.values.description)
    ? ctx.values.description[0]
    : ctx.values.description;

  // check for sanity
  if (!prize || !winnersStr || prize.length < 1 || winnersStr.length < 1) {
    return ctx.send({
      content: await getContext().i18n.translate(
        "components.edit_modal.errors.required_fields",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  }

  // Validate winners count
  const winners = parseInt(winnersStr, 10);
  if (
    Number.isNaN(winners) ||
    winners < 1 ||
    winners > FEATURE_LIMITS.MAX_WINNERS.PREMIUM
  ) {
    return ctx.send({
      content: await getContext().i18n.translate(
        "components.edit_modal.errors.invalid_winners",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  }

  let subscription: SubscriptionStatus;

  if (!getContext().drizzle) {
    return ctx.send({
      content: await getContext().i18n.translate(
        "common.errors.database_unavailable",
        { language: ctx.locale }
      ),
      ephemeral: true,
    });
  }

  try {
    subscription = await getPremiumStatus(
      {
        userId: ctx.user.id,
        guildId: ctx.guildID ?? null,
      },
      getContext().drizzle
    );
  } catch (error) {
    console.error("Failed to check premium status:", error);
    Sentry.captureException(error);

    return ctx.send({
      content: await getContext().i18n.translate(
        "premium.errors.check_failed",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  }

  const winnersLimit = checkFeatureLimit(
    subscription,
    winners,
    FEATURE_LIMITS.MAX_WINNERS.FREE,
    FEATURE_LIMITS.MAX_WINNERS.PREMIUM
  );

  if (!winnersLimit.allowed) {
    return ctx.send({
      content: await getContext().i18n.translate(
        "commands.start.errors.winners_too_many",
        {
          language: ctx.locale,
          params: {
            max: winnersLimit.effectiveLimit.toString(),
            premiumMax: FEATURE_LIMITS.MAX_WINNERS.PREMIUM.toString(),
          },
        }
      ),
      ephemeral: true,
    });
  }

  // Update the giveaway state
  try {
    await stub.updateGiveaway.mutate({
      prize: prize || "",
      winners,
      description: description || undefined,
    });

    return ctx.send({
      content: await getContext().i18n.translate(
        "components.edit_modal.messages.success",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error updating giveaway:", error);
    Sentry.captureException(error);
    return ctx.send({
      content: await getContext().i18n.translate(
        "components.edit_modal.errors.update_failed",
        {
          language: ctx.locale,
          params: {
            error: error instanceof Error ? error.message : String(error),
          },
        }
      ),
      ephemeral: true,
    });
  }
}
