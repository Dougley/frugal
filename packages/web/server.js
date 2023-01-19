import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';
import { createCloudflareKVSessionStorage } from '@remix-run/cloudflare';
import * as build from '@remix-run/dev/server-build';

const handleRequest = createPagesFunctionHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: (context) => {
    return {
      sessionStorage: createCloudflareKVSessionStorage({
        kv: context.env.KV_SESSIONS,
        cookie: {
          name: '__session',
          secrets: context.env.SESSION_SECRET.split(',').map((secret) =>
            secret.trim()
          ),
        },
      }),
      ...context.env,
    };
  },
});

export function onRequest(context) {
  return handleRequest(context);
}
