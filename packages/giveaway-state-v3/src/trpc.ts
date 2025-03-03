// adapted from https://github.com/markusahlstrand/trpc-durable-objects

import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { FetchEsque } from "@trpc/client/dist/internals/types";
import {
  FetchCreateContextFnOptions,
  fetchRequestHandler,
} from "@trpc/server/adapters/fetch";
import { StateRouter } from "./router";
import { transformer } from "./transformer";

export type DurableObjectProxy = {
  new (
    state: DurableObjectState,
    env: Env,
  ): {
    state: DurableObjectState;
    env: Env;
    alarm(): Promise<void>;
    fetch(request: Request): Promise<Response>;
  };
};

export type Context<Env> = {
  req: Request;
  resHeaders: Headers;
  state: DurableObjectState;
  env: Env;
};

export class ContextFactory<Env = any> {
  state: DurableObjectState;

  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  createContext({ req, resHeaders }: FetchCreateContextFnOptions) {
    return { req, resHeaders, state: this.state, env: this.env };
  }
}

export function createProxy(
  router: StateRouter,
  alarm?: (context: Omit<Context<Env>, "req" | "resHeaders">) => Promise<any>,
) {
  return class DOProxy implements DurableObject {
    state: DurableObjectState;
    env: Env;

    constructor(state: DurableObjectState, env: Env) {
      this.state = state;
      this.env = env;
    }

    static getFactory(namespace: DurableObjectNamespace, env: Env) {
      return {
        getInstance: (id: DurableObjectId) => this.getInstance(namespace, id),
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
            fetch: stub.fetch.bind(stub) as unknown as FetchEsque,
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
