/// <reference types="../worker-configuration.d.ts" />

import { drizzleD1 } from "@dougley/frugal-drizzle/workers";
import { createWorkersKVSessionStorage } from "@react-router/cloudflare";
import {
  type APIUser,
  type RESTGetAPICurrentUserGuildsResult,
} from "discord-api-types/v10";
import { createCookie } from "react-router";
import { Authenticator } from "remix-auth";
import { OAuth2Strategy } from "remix-auth-oauth2";
import type { PlatformProxy } from "wrangler";
import type { DiscordUser } from "~/types/DiscordUser";

type GetLoadContextArgs = {
  request: Request;
  context: {
    cloudflare: Omit<PlatformProxy<Env>, "dispose" | "caches" | "cf"> & {
      caches: PlatformProxy<Env>["caches"] | CacheStorage;
      cf: Request["cf"];
    };
  };
};

declare module "react-router" {
  export interface AppLoadContext extends ReturnType<typeof getLoadContext> {}
}

// Shared implementation compatible with Vite, Wrangler, and Cloudflare Pages
export function getLoadContext({ context }: GetLoadContextArgs) {
  const sessionCookie = createCookie("__session", {
    secrets: context.cloudflare.env.SESSION_SECRET.split(","),
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  const { getSession, commitSession, destroySession } =
    createWorkersKVSessionStorage({
      // The KV Namespace where you want to store sessions
      kv: context.cloudflare.env.KV_SESSIONS,
      cookie: sessionCookie,
    });
  const auth = new Authenticator<DiscordUser>();
  auth.use(
    discordAuth({
      clientId: context.cloudflare.env.DISCORD_CLIENT_ID,
      clientSecret: context.cloudflare.env.DISCORD_CLIENT_SECRET,
      callbackURL: context.cloudflare.env.DISCORD_CALLBACK_URL,
    }),
    "discord",
  );

  return {
    ...context,
    sessions: { getSession, commitSession, destroySession },
    auth,
    drizzle: drizzleD1(context.cloudflare.env.D1),
  };
}

const discordAuth = ({
  clientId,
  clientSecret,
  callbackURL,
}: {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
}) => {
  const API_BASE = "https://discord.com/api/v10";
  return new OAuth2Strategy<DiscordUser>(
    {
      clientId,
      clientSecret,
      authorizationEndpoint: `${API_BASE}/oauth2/authorize`,
      tokenEndpoint: `${API_BASE}/oauth2/token`,
      tokenRevocationEndpoint: `${API_BASE}/oauth2/token/revoke`,
      redirectURI: callbackURL,
      scopes: ["identify", "email", "guilds", "guilds.members.read"],
    },
    async ({ tokens, request }) => {
      try {
        const user: APIUser = await fetch(`${API_BASE}/users/@me`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken()}`,
          },
        }).then((res) => res.json());
        const guilds: RESTGetAPICurrentUserGuildsResult = await fetch(
          `${API_BASE}/users/@me/guilds`,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken()}`,
            },
          },
        ).then((res) => res.json());
        return {
          id: user.id,
          displayName: user.global_name,
          username: user.username,
          avatar: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator) % 5}.png`,
          discriminator: user.discriminator,
          guilds,
          __raw: user,
          accessToken: tokens.accessToken(),
          refreshToken: tokens.refreshToken(),
        };
      } catch (error) {
        console.error("CONTEXT: Error authenticating", error);
        throw new Error("Error authenticating");
      }
    },
  );
};
