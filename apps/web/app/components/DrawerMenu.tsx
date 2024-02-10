import * as Avatar from "@radix-ui/react-avatar";
import { Link, NavLink, useRouteLoaderData } from "@remix-run/react";
import { PermissionFlags, PermissionsBitField } from "discord-bitflag";
import React, { Suspense } from "react";
import { BsDiscord } from "react-icons/bs";
import {
  LuBug,
  LuExternalLink,
  LuGem,
  LuHome,
  LuLogIn,
  LuPartyPopper,
  LuScroll,
  LuSettings,
  LuTicket,
  LuUser,
} from "react-icons/lu";
import type { DiscordUser } from "~/services/authenticator.server";
import { ProfileMenu } from "./ProfileMenu";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function DrawerMenu({
  toggleDrawer,
}: {
  toggleDrawer: () => void;
}): React.ReactElement {
  const data = useRouteLoaderData("root") as {
    user: DiscordUser | null;
    sentrySettings: {
      environment: string;
      release: string;
    };
  };

  const { user } = data ?? {};

  return (
    <aside className="min-h-screen w-80">
      <ul className="menu h-full min-h-screen overflow-y-auto overflow-x-hidden rounded-r-2xl bg-base-200 p-4 text-base-content">
        <li>
          <div className="mr-auto flex h-16 items-center justify-center text-xl font-black">
            <Link to="/" onClick={toggleDrawer}>
              <span>
                <LuPartyPopper className="mr-2 inline-block h-8 w-8" />
                <span>GiveawayBot</span>
              </span>
            </Link>
            <div>
              {data.sentrySettings.environment === "staging" && (
                <span className="badge badge-info badge-outline">STG</span>
              )}
              {data.sentrySettings.environment !== "production" &&
                data.sentrySettings.environment !== "staging" && (
                  <span className="badge badge-warning badge-outline">DEV</span>
                )}
            </div>
          </div>
        </li>
        <li>
          <NavLink to="/" onClick={toggleDrawer}>
            <LuHome className="h-5 w-5" />
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/premium" onClick={toggleDrawer}>
            <LuGem className="h-5 w-5" />
            GiveawayBot Premium
          </NavLink>
        </li>
        {user && (
          <>
            <li>
              <NavLink to="/profile" onClick={toggleDrawer}>
                <LuUser className="h-5 w-5" />
                Your Profile
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
                      .filter((g) =>
                        new PermissionsBitField(Number(g.permissions)).has(
                          PermissionFlags.ManageGuild,
                        ),
                      )
                      .sort((a, b) => (a.name > b.name ? 1 : -1))
                      .map((guild) => (
                        <li key={guild.id} className="w-fit truncate">
                          <NavLink
                            to={`/guilds/${guild.id}`}
                            onClick={toggleDrawer}
                          >
                            <Avatar.Root className="avatar h-5 w-5">
                              <Avatar.Image
                                className="rounded-full"
                                src={
                                  guild.icon === null
                                    ? `https://cdn.discordapp.com/embed/avatars/${Math.abs(
                                        // this isnt strictly correct but it's close enough
                                        ((guild.id as any) >> 22) % 5,
                                      )}.png`
                                    : `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                                }
                                alt="avatar"
                              />
                              <Avatar.Fallback delayMs={600}>
                                <img
                                  className="rounded-full"
                                  src={`https://cdn.discordapp.com/embed/avatars/${Math.abs(
                                    ((guild.id as any) >> 22) % 5,
                                  )}.png`}
                                  alt="avatar"
                                />
                              </Avatar.Fallback>
                            </Avatar.Root>
                            {guild.name.length > 20
                              ? guild.name.substring(0, 20) + "..."
                              : guild.name}
                          </NavLink>
                        </li>
                      ))
                  ) : (
                    <li>
                      <Link to="/login" onClick={toggleDrawer}>
                        <LuLogIn className="h-5 w-5" />
                        Login
                      </Link>
                    </li>
                  )}
                </ul>
              </details>
            </li>
            <li>
              <NavLink to="/giveaways" onClick={toggleDrawer}>
                <LuTicket className="h-5 w-5" />
                All Giveaways <div className="badge badge-outline">beta</div>
              </NavLink>
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
                <Link
                  to="https://dougley.com/discord/terms"
                  target="_blank"
                  onClick={toggleDrawer}
                >
                  <LuScroll className="h-5 w-5" />
                  Terms of Service
                  <LuExternalLink className="inline-block h-4 w-4" />
                </Link>
              </li>
              <li>
                <Link
                  to="https://dougley.com/discord/privacy"
                  target="_blank"
                  onClick={toggleDrawer}
                >
                  <LuScroll className="h-5 w-5" />
                  Privacy Policy
                  <LuExternalLink className="inline-block h-4 w-4" />
                </Link>
              </li>
              <li>
                <Link
                  to="https://dougley.com/discord/paid-services"
                  target="_blank"
                  onClick={toggleDrawer}
                >
                  <LuScroll className="h-5 w-5" />
                  Paid Services Agreement
                  <LuExternalLink className="inline-block h-4 w-4" />
                </Link>
              </li>
            </ul>
          </details>
        </li>
        {/* profile menu, at the end of the menu and at the bottom of the div */}
        <div className="menu mt-auto w-full">
          {data.sentrySettings.environment !== "production" && (
            <button
              className="btn btn-error btn-sm"
              onClick={toggleDrawer}
              id="report-bug"
            >
              <LuBug className="h-5 w-5" />
              Report a Bug
            </button>
          )}
          <div className="divider" />
          <div className="flex items-center justify-between">
            <ProfileMenu toggleDrawer={toggleDrawer} />
          </div>
        </div>
      </ul>
    </aside>
  );
}
