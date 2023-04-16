import type { SessionStorage } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";

export const onRequestPost: PagesFunction<{
  KV_SESSIONS: KVNamespace;
}> = async (context) => {
  const sessionStorage = context.data.sessions as SessionStorage;
  const session = await sessionStorage.getSession(
    context.request.headers.get("Cookie")
  );
  const cookie = await sessionStorage.destroySession(session);
  return json(
    { success: true },
    { status: 200, headers: { "Set-Cookie": cookie } }
  );
};
