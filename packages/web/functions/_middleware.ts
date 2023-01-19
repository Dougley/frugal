import sentryPlugin from '@cloudflare/pages-plugin-sentry';
import { createCloudflareKVSessionStorage } from '@remix-run/cloudflare';

export const onRequest: PagesFunction<{
  SENTRY_DSN: string;
  KV_SESSIONS: KVNamespace;
  SESSION_SECRET: string;
}> = (context) => {
  context.data.sessions = createCloudflareKVSessionStorage({
    kv: context.env.KV_SESSIONS,
    cookie: {
      name: '__session',
      secrets: context.env.SESSION_SECRET.split(',').map((secret) =>
        secret.trim()
      ),
    },
  });
  return sentryPlugin({ dsn: context.env.SENTRY_DSN })(context);
};
