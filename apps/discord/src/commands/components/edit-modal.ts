import { EditModal as EditModalComponent } from "@dougley/frugal-utils";
import type {
  ComponentContext,
  ModalInteractionContext,
} from "slash-create/web";
import { EnvContext } from "../../env";

export default class EditButton {
  // Re-export static properties from the component
  public static button_id = EditModalComponent.button_id;
  public static modal_id = EditModalComponent.modal_id;
  public static button_id_regex = EditModalComponent.button_id_regex;
  public static modal_id_regex = EditModalComponent.modal_id_regex;
  public static createActionRow = EditModalComponent.createActionRow;
  public static createModal = EditModalComponent.createModal;

  /**
   * Handles the button click to open the edit modal
   * @param ctx The component context
   */
  public static async handleButtonInteraction(ctx: ComponentContext) {
    // Extract giveaway ID from button custom_id
    const giveawayId = ctx.customID.split(":")[1];

    if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
      return ctx.send({
        content: "Giveaway state not available",
        ephemeral: true,
      });
    }

    const stub = EnvContext.state.getInstance(
      EnvContext.env.GIVEAWAY_STATE,
      EnvContext.env.GIVEAWAY_STATE.idFromString(giveawayId)
    );

    const state = await stub.getState.query();

    if (!state) {
      return ctx.send({
        content: "That giveaway does not exist or has expired.",
        ephemeral: true,
      });
    }

    // Show the modal with pre-filled current values
    return ctx.sendModal(EditButton.createModal(giveawayId, state));
  }

  /**
   * Handles the modal submission
   * @param ctx The modal response context
   */
  public static async handleModalSubmit(ctx: ModalInteractionContext) {
    // Extract giveaway ID from modal custom_id
    const match = ctx.customID.match(EditButton.modal_id_regex);
    if (!match) {
      return ctx.send({
        content: "Invalid modal submission",
        ephemeral: true,
      });
    }

    const giveawayId = match[1];

    if (!EnvContext.env?.GIVEAWAY_STATE || !EnvContext.state) {
      return ctx.send({
        content: "Giveaway state not available",
        ephemeral: true,
      });
    }

    const stub = EnvContext.state.getInstance(
      EnvContext.env.GIVEAWAY_STATE,
      EnvContext.env.GIVEAWAY_STATE.idFromString(giveawayId)
    );

    // Get the current state
    const state = await stub.getState.query();
    if (!state) {
      return ctx.send({
        content: "That giveaway does not exist or has expired.",
        ephemeral: true,
      });
    }

    const prize = ctx.values.prize;
    const winnersStr = ctx.values.winners;
    const description = ctx.values.description;

    // check for sanity
    if (!prize || !winnersStr || prize.length < 1 || winnersStr.length < 1) {
      return ctx.send({
        content: "Prize and winners are required fields.",
        ephemeral: true,
      });
    }

    // Validate winners count
    const winners = parseInt(winnersStr, 10);
    if (isNaN(winners) || winners < 1 || winners > 50) {
      return ctx.send({
        content: "Winners count must be between 1 and 50.",
        ephemeral: true,
      });
    }

    // Update the giveaway state
    try {
      await stub.updateGiveaway.mutate({
        prize,
        winners,
        description,
      });

      return ctx.send({
        content: "Giveaway has been updated successfully!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error updating giveaway:", error);
      return ctx.send({
        content: `Failed to update giveaway: ${error instanceof Error ? error.message : String(error)}`,
        ephemeral: true,
      });
    }
  }
}
