/// <reference types="@cloudflare/workers-types" />

declare type Env = {
  KV: KVNamespace;
  D1: D1Database;
  GIVEAWAY_STATE: DurableObjectNamespace;
  STORAGE: R2Bucket;
  DISCORD_APP_ID: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_BOT_TOKEN: string;
  SUMMARY_URL: string;
  SENTRY_DSN: string | undefined;
  DEVELOPMENT_GUILD?: string;
};

declare type WebEnv = Env & {
  SESSION_SECRET: string;
  DISCORD_REDIRECT_URI: string;
  DISCORD_CLIENT_SECRET: string;
  KV_SESSIONS: KVNamespace;
  DISCORD_CLIENT_ID: string;
  STRIPE_SECRET_KEY: string;
};
