import type { SessionStorage } from "@remix-run/cloudflare";

export const onRequestGet: PagesFunction<{
  DISCORD_CLIENT_ID: string;
  DISCORD_REDIRECT_URI: string;
  sessions: SessionStorage;
}> = (context) => {
  const url = new URL("https://discord.com/oauth2/authorize");
  const state = crypto.randomUUID();
  url.searchParams.append("client_id", context.env.DISCORD_CLIENT_ID);
  url.searchParams.append("redirect_uri", context.env.DISCORD_REDIRECT_URI);
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", "identify guilds");
  url.searchParams.append("state", state);
  url.searchParams.append("prompt", "none");
  // url.searchParams.append('nonce', crypto.randomUUID());
  // const redirect = Response.redirect(url.toString(), 302);
  const redirect = new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": `state=${state}; Path=/; HttpOnly Expires=${new Date(
        Date.now() + 1000 * 60 * 5
      ).toUTCString()}`,
    },
  });
  return redirect;
};
