import {
  ButtonStyle,
  type ComponentButton,
  ComponentType,
} from "slash-create/web";

/**
 * A button component for joining or leaving giveaways.
 */
export const JoinButton = {
  // Properties for ID patterns
  custom_id: "giveaway_join",
  custom_id_regex: /^giveaway_(join|leave):[a-f0-9]{64}$/,

  /**
   * Creates a join button for a giveaway
   * @param giveawayId The ID of the giveaway to join
   * @returns The button component
   */
  createButton(giveawayId: string): ComponentButton {
    return {
      type: ComponentType.BUTTON as const,
      style: ButtonStyle.PRIMARY,
      emoji: {
        name: "🎉",
      },
      label: "Enter Giveaway",
      custom_id: `${JoinButton.custom_id}:${giveawayId}`,
    };
  },

  /**
   * Creates a row containing the join button
   * @param giveawayId The ID of the giveaway to join
   * @returns An action row with the join button
   */
  createActionRow(giveawayId: string) {
    return {
      type: ComponentType.ACTION_ROW as const,
      components: [JoinButton.createButton(giveawayId)],
    };
  },
};
