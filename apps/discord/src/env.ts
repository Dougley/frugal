import { drizzleD1 } from '@dougley/frugal-drizzle/workers';
import { createProxy } from '@dougley/frugal-savestate';

export const EnvContext = {
  env: null as Env | null,
  state: null as ReturnType<typeof createProxy> | null,
  drizzle: null as ReturnType<typeof drizzleD1> | null
};
