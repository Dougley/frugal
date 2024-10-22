import { Link, NavLink } from "@remix-run/react";
import React, { Suspense } from "react";
import {
  LuExternalLink,
  LuGem,
  LuHome,
  LuPartyPopper,
  LuScroll,
  LuSettings,
} from "react-icons/lu";
import { useDrawer } from "./contexts/DrawerContext";
import { ProfileMenu } from "./ProfileMenu";
import { ThemeSwitcher } from "./ThemeChanger";

// import { ThemeSwitcher } from "./ThemeSwitcher";

export function DrawerMenu(): React.ReactElement {
  const { toggleDrawer } = useDrawer();
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
          <div className="flex items-center justify-between">
            <ProfileMenu />
          </div>
        </div>
      </ul>
    </aside>
  );
}
