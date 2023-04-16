declare type Env = {
  KV: KVNamespace;
  GIVEAWAY_STATE: DurableObjectNamespace;
  STORAGE: D1Database;
  DISCORD_APP_ID: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_BOT_TOKEN: string;
};
