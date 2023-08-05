import { Database } from '@dougley/d1-database';
import { v2 } from '@dougley/frugal-giveaways-do';
import { HyperNamespaceProxy, proxyHyperDurables } from '@ticketbridge/hyper-durable';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { RespondFunction, Server, TransformedRequest } from 'slash-create';
import { MultipartData } from '../util/multipartData';

export type ServerRequestHandler = (treq: TransformedRequest, respond: RespondFunction, wait: (f: any) => void) => void;

/**
 * A server for Cloudflare Workers.
 * @see https://developers.cloudflare.com/workers/
 */
export class CFWorkerServer extends Server {
  handler?: ServerRequestHandler;
  env?: Env;
  db?: Kysely<Database>;
  states?: HyperNamespaceProxy<v2.GiveawayStateV2, Env>;
  constructor() {
    super({ alreadyListening: true });
    this.isWebserver = true;
  }

  private fetchHandler(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    handler: ServerRequestHandler
  ): Promise<Response> | Response {
    // We cant really initialize these in the constructor because the env is not available at that time
    if (!this.env) this.env = env;
    if (!this.db)
      this.db = new Kysely<Database>({
        dialect: new D1Dialect({ database: env.D1 })
      });
    this.states = proxyHyperDurables(env, {
      GIVEAWAY_STATE: v2.GiveawayStateV2
    }).GIVEAWAY_STATE;
    if (request.method !== 'POST') return new Response('Only POST requests are allowed', { status: 405 });
    return new Promise(async (resolve) => {
      const body = await request.text();
      handler(
        {
          headers: Object.fromEntries(request.headers.entries()),
          body: request.body ? JSON.parse(body) : request.body,
          request,
          response: null
        },
        async (response) => {
          if (response.files) {
            const data = new MultipartData();
            for (const file of response.files) await data.attach(file.name, file.file, file.name);
            await data.attach('payload_json', JSON.stringify(response.body));
            resolve(
              new Response(data.finish(), {
                status: response.status || 200,
                headers: {
                  ...((response.headers || {}) as Record<string, string>),
                  'content-type': 'multipart/form-data; boundary=' + data.boundary
                }
              })
            );
          } else
            resolve(
              new Response(JSON.stringify(response.body), {
                status: response.status || 200,
                headers: {
                  ...((response.headers || {}) as Record<string, string>),
                  'content-type': 'application/json'
                }
              })
            );
        },
        ctx.waitUntil.bind(ctx)
      );
    });
  }

  get moduleWorkerBindings(): ExportedHandler<Env> {
    return {
      fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
        if (this.handler) return this.fetchHandler(request, env, ctx, this.handler);
        return new Response('No handler set', { status: 500 });
      }
    };
  }

  /** @private */
  createEndpoint(path: string, handler: ServerRequestHandler) {
    this.handler = handler;
    return this;
  }
}
 
export const server = new CFWorkerServer();
