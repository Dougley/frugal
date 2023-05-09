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
};

declare type WebEnv = Env & {
  SESSION_SECRETS: string;
  REDIRECT_URL: string;
  DISCORD_CLIENT_SECRET: string;
};
