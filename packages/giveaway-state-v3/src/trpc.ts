// adapted from https://github.com/markusahlstrand/trpc-durable-objects

import { drizzleDurable, migrate } from "@dougley/frugal-drizzle/durables";
import migrations from "@dougley/frugal-drizzle/durables/drizzle/migrations.js";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import {
  type FetchCreateContextFnOptions,
  fetchRequestHandler,
} from "@trpc/server/adapters/fetch";
import type { StateRouter } from "./router";
import { transformer } from "./transformer";

export type DurableObjectProxy = {
  new (
    state: DurableObjectState,
    env: LegacyEnv
  ): {
    state: DurableObjectState;
    env: LegacyEnv;
    alarm(): Promise<void>;
    fetch(request: Request): Promise<Response>;
  };
};

export type Context<LegacyEnv> = {
  req: Request;
  resHeaders: Headers;
  state: DurableObjectState;
  env: LegacyEnv;
};

export class ContextFactory<LegacyEnv = unknown> {
  state: DurableObjectState;

  env: LegacyEnv;

  constructor(state: DurableObjectState, env: LegacyEnv) {
    this.state = state;
    this.env = env;
  }

  createContext({ req, resHeaders }: FetchCreateContextFnOptions) {
    return { req, resHeaders, state: this.state, env: this.env };
  }
}

export function createProxy(
  router: StateRouter,
  alarm?: (
    context: Omit<Context<LegacyEnv>, "req" | "resHeaders">
  ) => Promise<unknown>
) {
  return class DOProxy implements DurableObject {
    state: DurableObjectState;
    env: LegacyEnv;
    db: ReturnType<typeof drizzleDurable>;

    constructor(state: DurableObjectState, env: LegacyEnv) {
      this.state = state;
      this.env = env;
      this.db = drizzleDurable(state.storage);

      this.state.blockConcurrencyWhile(async () => {
        // wait for drizzle to be ready
        await migrate(this.db, migrations);
      });
    }

    static getFactory(namespace: DurableObjectNamespace, _env: LegacyEnv) {
      return {
        getInstance: (id: DurableObjectId) =>
          DOProxy.getInstance(namespace, id),
      };
    }

    static getInstance(namespace: DurableObjectNamespace, id: DurableObjectId) {
      const stub = namespace.get(id);
      const proxy = createTRPCClient<StateRouter>({
        links: [
          loggerLink(),
          httpBatchLink({
            transformer,
            url: "http://localhost:8787/trpc",
            fetch: stub.fetch.bind(stub) as unknown as typeof fetch,
          }),
        ],
      });
      return proxy;
    }

    async alarm() {
      if (alarm) {
        await alarm({
          state: this.state,
          env: this.env,
        });
      }
    }

    async fetch(request: Request) {
      const contextFactory = new ContextFactory(this.state, this.env);

      return fetchRequestHandler({
        endpoint: "/trpc",
        req: request,
        router: router,
        createContext: contextFactory.createContext.bind(this),
      });
    }
  };
}
