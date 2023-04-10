import { RespondFunction, Server, TransformedRequest } from 'slash-create';
import { MultipartData } from '../util/multipartData';

export type ServerRequestHandler = (treq: TransformedRequest, respond: RespondFunction, wait: (f: any) => void) => void;

/**
 * A server for Cloudflare Workers.
 * @see https://developers.cloudflare.com/workers/
 */
export class CFWorkerServer extends Server {
  handler?: ServerRequestHandler;
  env?: any;
  constructor() {
    super({ alreadyListening: true });
    this.isWebserver = true;
  }

  private fetchHandler(
    server: ServerRequestHandler,
    request: Request,
    env: any,
    ctx: ExecutionContext
  ): Promise<Response> | Response {
    if (!this.env) this.env = env; // for later use
    if (request.method !== 'POST') return new Response('Only POST requests are allowed', { status: 405 });
    return new Promise(async (resolve) => {
      const body = await request.text();
      server(
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

  get moduleWorkerBindings(): ExportedHandler {
    const handler = this.handler;
    const fetchHandler = this.fetchHandler;
    return {
      fetch: fetchHandler.bind(this, ...arguments, handler)
    };
  }

  /** @private */
  createEndpoint(path: string, handler: ServerRequestHandler) {
    this.handler = handler;
    return this;
  }
}
