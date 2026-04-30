/// <reference types="@dougley/types/giveaway-types" />

import { TRPCError } from "@trpc/server";

/**
 * Validates that a giveaway is in the specified state
 */
export const validateGiveawayState = (
  giveaway: { state: string },
  allowedStates: GiveawayState[]
) => {
  if (!allowedStates.includes(giveaway.state as GiveawayState)) {
    const stateMessage =
      allowedStates.length === 1
        ? `be in ${allowedStates[0]} state, but is currently ${giveaway.state}`
        : `be in one of the following states: ${allowedStates.join(", ")}. Currently ${giveaway.state}`;

    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Giveaway must ${stateMessage}`,
    });
  }
};
