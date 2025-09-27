import { ComponentType, TextInputStyle } from "slash-create/web";

/**
 * Modal component for editing giveaways
 */
export const EditModal = {
  // Static properties for ID patterns
  button_id: "edit_giveaway_button",
  modal_id: "edit_giveaway",

  // Regex patterns to match interactions
  button_id_regex: /^edit_giveaway_button:(\w+)$/,
  modal_id_regex: /^edit_giveaway:(\w+)$/,

  /**
   * Creates a button for editing a giveaway
   * @param giveawayId The ID of the giveaway to edit
   * @returns An action row with the edit button
   */
  createActionRow(giveawayId: string) {
    return {
      type: ComponentType.ACTION_ROW as const,
      components: [
        {
          type: ComponentType.BUTTON as const,
          style: 5, // Primary style
          label: "Edit Giveaway",
          custom_id: `${EditModal.button_id}:${giveawayId}`,
        },
      ],
    };
  },

  /**
   * Creates the modal configuration for editing a giveaway
   * @param giveawayId The ID of the giveaway
   * @param state The current giveaway state
   * @returns Modal configuration
   */
  createModal(
    giveawayId: string,
    state: { prize: string; winners: number; description?: string | null }
  ) {
    return {
      title: "Edit Giveaway",
      custom_id: `${EditModal.modal_id}:${giveawayId}`,
      components: [
        {
          type: ComponentType.ACTION_ROW as const,
          components: [
            {
              type: ComponentType.TEXT_INPUT as const,
              label: "Prize",
              custom_id: "prize",
              style: TextInputStyle.SHORT,
              value: state.prize,
              min_length: 1,
              max_length: 100,
              required: true,
            },
          ],
        },
        {
          type: ComponentType.ACTION_ROW as const,
          components: [
            {
              type: ComponentType.TEXT_INPUT as const,
              label: "Winners (1-50)",
              custom_id: "winners",
              style: TextInputStyle.SHORT,
              value: state.winners.toString(),
              min_length: 1,
              max_length: 2,
              required: true,
            },
          ],
        },
        {
          type: ComponentType.ACTION_ROW as const,
          components: [
            {
              type: ComponentType.TEXT_INPUT as const,
              label: "Description (optional)",
              custom_id: "description",
              style: TextInputStyle.PARAGRAPH,
              value: state.description || "",
              max_length: 1000,
              required: false,
            },
          ],
        },
      ],
    };
  },
};
