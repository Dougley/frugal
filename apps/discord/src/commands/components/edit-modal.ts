import { EditModal } from "@dougley/frugal-utils";
import type {
  ComponentContext,
  ModalInteractionContext,
} from "slash-create/web";
import { getContext } from "../../context";

// Export the patterns and methods for commands/index.ts
export const button_id_regex = EditModal.button_id_regex;
export const modal_id_regex = EditModal.modal_id_regex;

/**
 * Handles the button click to open the edit modal
 * @param ctx The component context
 */
export async function handleButtonInteraction(ctx: ComponentContext) {
  // Extract giveaway ID from button custom_id
  const giveawayId = ctx.customID.split(":")[1];

  if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
    return ctx.send({
      content: await getContext().i18n.translate(
        "components.edit_modal.errors.giveaway_state_unavailable",
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
        "components.edit_modal.errors.giveaway_not_found",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  }

  // Show the modal with pre-filled current values
  return ctx.sendModal(EditModal.createModal(giveawayId, state));
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
        "components.edit_modal.errors.invalid_modal_submission",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  }

  const giveawayId = match[1];

  if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
    return ctx.send({
      content: await getContext().i18n.translate(
        "components.edit_modal.errors.giveaway_state_unavailable",
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
        "components.edit_modal.errors.giveaway_not_found",
        {
          language: ctx.locale,
        }
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
  if (Number.isNaN(winners) || winners < 1 || winners > 50) {
    return ctx.send({
      content: await getContext().i18n.translate(
        "components.edit_modal.errors.invalid_winners_count",
        {
          language: ctx.locale,
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
        "components.edit_modal.messages.update_success",
        {
          language: ctx.locale,
        }
      ),
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error updating giveaway:", error);
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
