import type { Context } from "@dougley/frugal-savestate";
import { stateRouter } from "@dougley/frugal-savestate";

export function createTestCaller(ctx: Context<LegacyEnv>) {
  return stateRouter.createCaller(ctx);
}
