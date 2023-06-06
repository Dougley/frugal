import { Link } from "@remix-run/react";
import type { ReactElement } from "react";
import { LuMenu } from "react-icons/lu";

export function Navbar(): ReactElement {
  return (
    <div className="navbar">
      <div className="flex-1 px-2 lg:flex-none">
        <label
          htmlFor="drawer-sidemenu"
          className="btn-ghost btn-square btn xl:hidden"
        >
          <LuMenu className="text-2xl" />
        </label>
        <Link className="btn-ghost btn text-lg font-bold normal-case" to="/">
          GiveawayBot
        </Link>
      </div>
    </div>
  );
}
