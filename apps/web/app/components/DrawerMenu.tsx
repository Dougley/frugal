import * as Avatar from "@radix-ui/react-avatar";
import { Link, NavLink, useRouteLoaderData } from "@remix-run/react";
import React, { Suspense } from "react";
import { BsDiscord } from "react-icons/bs";
import {
  LuExternalLink,
  LuGem,
  LuHome,
  LuLogIn,
  LuPartyPopper,
  LuScroll,
  LuSettings,
  LuUser,
} from "react-icons/lu";
import type { DiscordUser } from "~/services/authenticator.server";
import { ProfileMenu } from "./ProfileMenu";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function DrawerMenu(): React.ReactElement {
  const { user } = useRouteLoaderData("root") as {
    user: DiscordUser | null;
  };

  return (
    <aside className="min-h-screen w-80">
      <ul className="menu rounded-box h-full min-h-screen overflow-y-auto overflow-x-hidden bg-base-200 p-4 text-base-content">
        <li>
          <div className="mr-auto flex h-16 items-center justify-center text-xl font-black">
            <Link to="/">
              <LuPartyPopper className="mr-2 inline-block h-8 w-8" />
              GiveawayBot
            </Link>
          </div>
        </li>
        <li>
          <NavLink to="/">
            <LuHome className="h-5 w-5" />
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/premium">
            <LuGem className="h-5 w-5" />
            GiveawayBot Premium
          </NavLink>
        </li>
        {user && (
          <>
            <li>
              <NavLink to="/profile">
                <LuUser className="h-5 w-5" />
                Your profile
              </NavLink>
            </li>
            <li>
              <details>
                <summary>
                  <BsDiscord className="h-5 w-5" />
                  Your Servers
                </summary>
                <ul>
                  {user ? (
                    user.guilds
                      .filter(
                        (g) =>
                          g.owner ||
                          (BigInt(g.permissions) & BigInt(0x20)) == BigInt(0x20)
                      )
                      .sort((a, b) => (a.name > b.name ? 1 : -1))
                      .map((guild) => (
                        <li key={guild.id} className="w-fit truncate">
                          <NavLink to={`/guilds/${guild.id}`}>
                            <Avatar.Root className="avatar h-5 w-5">
                              <Avatar.Image
                                className="rounded-full"
                                src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                alt="avatar"
                              />
                              <Avatar.Fallback delayMs={600}>
                                <img
                                  className="rounded-full"
                                  src={`https://cdn.discordapp.com/embed/avatars/${Math.abs(
                                    ((guild.id as any) >> 22) % 5
                                  )}.png`}
                                  alt="avatar"
                                />
                              </Avatar.Fallback>
                            </Avatar.Root>
                            {guild.name}
                          </NavLink>
                        </li>
                      ))
                  ) : (
                    <li>
                      <Link to="/login">
                        <LuLogIn className="h-5 w-5" />
                        Login
                      </Link>
                    </li>
                  )}
                </ul>
              </details>
            </li>
          </>
        )}
        <li>
          <details>
            <summary>
              <LuSettings className="h-5 w-5" />
              Settings
            </summary>
            <ul>
              <li>
                <Suspense fallback={null}>
                  <ThemeSwitcher />
                </Suspense>
              </li>
              <li>
                <Link to="https://dougley.com/discord/terms" target="_blank">
                  <LuScroll className="h-5 w-5" />
                  Terms of Service
                  <LuExternalLink className="inline-block h-4 w-4" />
                </Link>
              </li>
              <li>
                <Link to="http://dougley.com/discord/privacy" target="_blank">
                  <LuScroll className="h-5 w-5" />
                  Privacy Policy
                  <LuExternalLink className="inline-block h-4 w-4" />
                </Link>
              </li>
            </ul>
          </details>
        </li>
        {/* profile menu, at the end of the menu and at the bottom of the div */}
        <div className="menu mt-auto w-full">
          <div className="divider" />
          <div className="flex items-center justify-between">
            <ProfileMenu />
          </div>
        </div>
      </ul>
    </aside>
  );
}
