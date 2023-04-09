import { createWorkersKVSessionStorage } from "@remix-run/cloudflare";
import { session as SessionCookie } from "./cookies";

export const sessions = (context?: { KV_SESSIONS: KVNamespace }) => {
  let _sessions;
  if (!_sessions && context?.KV_SESSIONS) {
    console.log("Creating sessions");
    _sessions = createWorkersKVSessionStorage({
      cookie: SessionCookie,
      kv: context.KV_SESSIONS,
    });
  }
  return _sessions;
};
