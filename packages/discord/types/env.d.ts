interface Env {
  TIMERS: DurableObjectNamespace;
  KV: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
  STORAGE: R2Bucket;
  // __D1_BETA__DB: D1Database;
  DEV?: boolean;
  ENVIROMENT?: string;
}
