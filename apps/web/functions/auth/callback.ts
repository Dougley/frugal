import type { SessionStorage } from "@remix-run/cloudflare";
import type {
  RESTGetAPICurrentUserGuildsResult,
  RESTGetAPICurrentUserResult,
} from "discord-api-types/v9";

export const onRequestGet: PagesFunction<{
  DISCORD_CLIENT_ID: string;
  DISCORD_REDIRECT_URI: string;
  DISCORD_CLIENT_SECRET: string;
  KV_SESSIONS: KVNamespace;
}> = async (context) => {
  const sessionStorage = context.data.sessions as SessionStorage;
  const url = new URL(context.request.url);
  if (!context.request.headers.has("Cookie")) {
    return Response.redirect(`${url.origin}/auth/login`, 302);
  }
  // https://stackoverflow.com/a/64472572/8784402
  const cookies = Object.fromEntries(
    context.request.headers
      .get("Cookie")!
      .split("; ")
      .map((v) => v.split(/=(.*)/s).map(decodeURIComponent))
  );
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  if (!code || !returnedState || cookies.state !== returnedState) {
    return Response.redirect(`${url.origin}/auth/login`, 302);
  }
  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: context.env.DISCORD_CLIENT_ID,
      client_secret: context.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: context.env.DISCORD_REDIRECT_URI,
      scope: "identify guilds",
    }),
  });
  if (!response.ok) {
    return Response.redirect(`${url.origin}/auth/login`, 302);
  }
  const {
    access_token,
    refresh_token,
  }: {
    access_token: string;
    refresh_token: string;
  } = await response.json();
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  if (!userResponse.ok) {
    return Response.redirect(`${url.origin}/auth/login`, 302);
  }
  const user = (await userResponse.json()) as RESTGetAPICurrentUserResult;
  const guildsResponse = await fetch(
    "https://discord.com/api/users/@me/guilds",
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );
  if (!guildsResponse.ok) {
    return Response.redirect(`${url.origin}/auth/login`, 302);
  }
  const guilds =
    (await guildsResponse.json()) as RESTGetAPICurrentUserGuildsResult;
  const guildIds = guilds.map((guild) => ({
    id: guild.id,
    permissions: guild.permissions,
  }));
  const session = await sessionStorage.getSession(user.id);
  session.set("user", user);
  session.set("guilds", guildIds);
  session.set("refresh_token", refresh_token);
  const newSession = await sessionStorage.commitSession(session, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
  });
  // const redirect = Response.redirect(`${url.origin}/`, 302);
  const redirect = new Response(null, {
    status: 302,
    headers: {
      Location: `${url.origin}/`,
      "Set-Cookie": newSession,
    },
  });
  return redirect;
};
