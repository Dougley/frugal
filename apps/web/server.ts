import { handleFetch } from "@dougley/sentry-remix";
import {
  createWorkersKVSessionStorage,
  logDevReady,
} from "@remix-run/cloudflare";
import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "@remix-run/dev/server-build";
import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/rest/v9/user";
import { Authenticator } from "remix-auth";
import { Toucan } from "toucan-js";
import type { DiscordUser } from "~/services/authenticator.server";
import { DiscordStrategy } from "./app/services/DiscordStrategy.server";

if (process.env.NODE_ENV === "development") {
  logDevReady(build);
}

export const onRequest = async (
  context: EventContext<
    WebEnv & {
      CF_PAGES: 1 | undefined;
      CF_PAGES_BRANCH: string | undefined;
      CF_PAGES_COMMIT_SHA: string | undefined;
      SENTRY_DSN: string | undefined;
    },
    any,
    any
  >,
) => {
  const sessionStorage = createWorkersKVSessionStorage({
    cookie: {
      name: "SESSION_ID",
      secrets: context.env.SESSION_SECRET.split(","),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // its for KV expiration :)
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
        prompt: "none",
      },
      async ({ accessToken, refreshToken, extraParams, profile, context }) => {
        const guildsResponse = await fetch(
          "https://discord.com/api/v9/users/@me/guilds",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        const guildsData =
          (await guildsResponse.json()) as RESTAPIPartialCurrentUserGuild[];
        const user = {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          discriminator: profile.discriminator,
          avatar: profile.photos[0].value,
          email: profile.emails?.[0].value,
          guilds: guildsData,
        };
        return user;
      },
    ),
    "discord",
  );

  const sentry = new Toucan({
    debug: process.env.NODE_ENV === "development",
    dsn: context.env.SENTRY_DSN,
    environment: context.env.CF_PAGES
      ? context.env.CF_PAGES_BRANCH === "main"
        ? "production"
        : "staging"
      : "unknown",
    release: context.env.CF_PAGES ? context.env.CF_PAGES_COMMIT_SHA : "unknown",
    context,
  });

  const handler = createPagesFunctionHandler({
    build,
    mode: process.env.NODE_ENV,
    getLoadContext: (context) => {
      return { ...context.env, sessionStorage, authenticator, sentry };
    },
  });

  const response = await handleFetch(
    sentry,
    context,
    context.request,
    handler,
    build,
  );
  return response;
};
