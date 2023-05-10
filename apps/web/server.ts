import { createWorkersKVSessionStorage } from "@remix-run/cloudflare";
import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "@remix-run/dev/server-build";
import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/rest/v9/user";
import { Authenticator } from "remix-auth";
import type { DiscordUser } from "~/services/authenticator.server";
import { DiscordStrategy } from "./app/services/DiscordStrategy.server";

const handleRequest = createPagesFunctionHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: (context) => {
    const sessionStorage = createWorkersKVSessionStorage({
      cookie: {
        name: "SESSION_ID",
        secrets: context.env.SESSION_SECRET,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
      kv: context.env.KV_SESSIONS,
    });
    const authenticator = new Authenticator<DiscordUser>(sessionStorage);
    authenticator.use(
      new DiscordStrategy(
        {
          clientID: context.env.DISCORD_CLIENT_ID,
          clientSecret: context.env.DISCORD_CLIENT_SECRET,
          callbackURL: context.env.DISCORD_REDIRECT_URI,
          scope: ["identify", "guilds", "guilds.members.read"],
          prompt: "consent",
        },
        async ({
          accessToken,
          refreshToken,
          extraParams,
          profile,
          context,
        }) => {
          const guildsResponse = await fetch(
            "https://discord.com/api/v9/users/@me/guilds",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const guildsData =
            (await guildsResponse.json()) as RESTAPIPartialCurrentUserGuild[];
          const user = {
            id: profile.id,
            username: profile.displayName,
            discriminator: profile._json.discriminator,
            avatar: profile.photos[0].value,
            email: profile.emails?.[0].value,
            guilds: guildsData,
          };
          return user;
        }
      ),
      "discord"
    );
    return { ...context.env, sessionStorage, authenticator };
  },
});

export function onRequest(context: EventContext<any, any, any>) {
  return handleRequest(context);
}
