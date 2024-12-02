import { SessionStorage, type AppLoadContext } from "react-router";
import { type PlatformProxy } from "wrangler";

import { PrismaClient, PrismaD1 } from "@dougley/d1-prisma";
import { createCookie } from "react-router";
import { createWorkersKVSessionStorage } from "@react-router/cloudflare";
import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/v9";
import { Authenticator } from "remix-auth";
import { DiscordStrategy } from "remix-auth-discord";
import type { DiscordUser } from "~/types/DiscordUser";

type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
    sessions: {
      getSession: SessionStorage["getSession"];
      commitSession: SessionStorage["commitSession"];
      destroySession: SessionStorage["destroySession"];
    };
    auth: Authenticator<DiscordUser>;
    prisma: PrismaClient;
  }
}

type GetLoadContext = (args: {
  request: Request;
  context: { cloudflare: Cloudflare }; // load context _before_ augmentation
}) => AppLoadContext;

// Shared implementation compatible with Vite, Wrangler, and Cloudflare Pages
export const getLoadContext: GetLoadContext = ({ context, request }) => {
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
  const auth = new Authenticator<DiscordUser>(
    {
      getSession,
      commitSession,
      destroySession,
    },
    {
      throwOnError: true,
    },
  );
  auth.use(
    discordAuth({
      clientID: context.cloudflare.env.DISCORD_CLIENT_ID,
      clientSecret: context.cloudflare.env.DISCORD_CLIENT_SECRET,
      callbackURL: context.cloudflare.env.DISCORD_CALLBACK_URL,
    }),
  );
  const adapter = new PrismaD1(context.cloudflare.env.D1);
  const prisma = new PrismaClient({ adapter });
  return {
    ...context,
    sessions: { getSession, commitSession, destroySession },
    auth,
    prisma,
  };
};

const discordAuth = ({
  clientID,
  clientSecret,
  callbackURL,
}: {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}) =>
  new DiscordStrategy(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope: ["identify", "email", "guilds", "guilds.members.read"],
      prompt: "consent",
    },
    async ({
      accessToken,
      refreshToken,
      extraParams,
      profile,
    }): Promise<DiscordUser> => {
      try {
        const guilds = (await fetch(
          "https://discord.com/api/v9/users/@me/guilds",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ).then((res) => res.json())) as RESTAPIPartialCurrentUserGuild[];
        return {
          id: profile.id,
          username: profile.__json.username,
          displayName: profile.displayName,
          avatar: profile.photos?.[0]?.value
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.photos?.[0]?.value}.png`
            : `https://cdn.discordapp.com/embed/avatars/${
                // discord's default avatars
                Number((BigInt(profile.id) >> BigInt(22)) % BigInt(6))
              }.png`,
          email: profile.emails?.[0]?.value,
          guilds,
        };
      } catch (error) {
        console.error("Error fetching guilds", error);
        return {
          id: profile.id,
          username: profile.__json.username,
          displayName: profile.displayName,
          avatar: profile.photos?.[0]?.value,
          email: profile.emails?.[0]?.value,
          guilds: [],
        };
      }
    },
  );
