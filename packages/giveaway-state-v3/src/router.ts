/// <reference types="@dougley/types/summaries" />
/// <reference types="@dougley/types/giveaway-types" />

/**
 * GiveawayStateV3 TRPC Router
 *
 * This file merges the sub-routers into a single flat router to maintain
 * backward compatibility with existing consumers.
 *
 * The router is organized into sub-modules:
 * - entries: Entry management (join/leave/list)
 * - giveaway: Lifecycle (begin/update/end/draw/flush/cleanup)
 * - slots: Concurrent slot reservation
 *
 * @see ./routers/entries.ts
 * @see ./routers/giveaway.ts
 * @see ./routers/slots.ts
 */

import { entriesRouter } from "./routers/entries";
import { giveawayRouter } from "./routers/giveaway";
import { router } from "./routers/instance";
import { slotsRouter } from "./routers/slots";

/**
 * Main state router for the GiveawayStateV3 Durable Object
 *
 * Maintains backward compatibility by exposing procedures with their
 * original names (e.g., `addEntry`, `beginGiveaway`) while internally
 * organizing code into sub-routers.
 */
export const stateRouter = router({
  // ===== Slot Management =====
  reserveSlot: slotsRouter.reserve,
  releaseSlot: slotsRouter.release,

  // ===== Entry Management =====
  getEntries: entriesRouter.getAll,
  getEntriesPaginated: entriesRouter.getPaginated,
  addEntry: entriesRouter.add,
  removeEntry: entriesRouter.remove,

  // ===== Giveaway Lifecycle =====
  getState: giveawayRouter.getState,
  getActiveGiveaways: giveawayRouter.getActiveGiveaways,
  beginGiveaway: giveawayRouter.begin,
  startAlarm: giveawayRouter.startAlarm,
  updateGiveaway: giveawayRouter.update,
  endGiveaway: giveawayRouter.end,
  drawWinners: giveawayRouter.drawWinners,
  flush: giveawayRouter.flush,
  cleanup: giveawayRouter.cleanup,
});

export type StateRouter = typeof stateRouter;
export type { TRPCInstance as t } from "./routers/instance";
