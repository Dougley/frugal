import { Link } from "@remix-run/react";
import type { ReactElement } from "react";
import { LuMenu } from "react-icons/lu";

export function Navbar(): ReactElement {
  return (
    <div className="navbar">
      <div className="flex-1 px-2 lg:flex-none">
        <label
          htmlFor="drawer-sidemenu"
          className="btn btn-square btn-ghost xl:hidden"
        >
          <LuMenu className="text-2xl" />
        </label>
        <Link className="btn btn-ghost text-lg font-bold normal-case" to="/">
          GiveawayBot
        </Link>
      </div>
    </div>
  );
}
