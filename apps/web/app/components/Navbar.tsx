import { Link } from "@remix-run/react";
import type { ReactElement } from "react";
import { Suspense } from "react";
import { ProfileButton } from "./ProfileButton";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Navbar(): ReactElement {
  return (
    <div className="navbar bg-base-300">
      <div className="flex-1 px-2 lg:flex-none">
        <Link className="btn-ghost btn text-lg font-bold normal-case" to="/">
          GiveawayBot
        </Link>
      </div>
      <div className="flex flex-1 justify-end px-2">
        <div className="flex items-stretch space-x-2">
          <Suspense fallback={null}>
            <ThemeSwitcher />
          </Suspense>
          <ProfileButton />
        </div>
      </div>
    </div>
  );
}
