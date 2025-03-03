import { createProxy } from '@dougley/frugal-savestate';

export const EnvContext = {
  env: null as Env | null,
  state: null as ReturnType<typeof createProxy> | null
};
