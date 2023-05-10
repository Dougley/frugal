import * as Avatar from "@radix-ui/react-avatar";
import { Link, useRouteLoaderData } from "@remix-run/react";
import type { ReactElement } from "react";
import { MdLogin, MdLogout, MdOutlineSpaceDashboard } from "react-icons/md";
import type { DiscordUser } from "~/services/authenticator.server";

export function ProfileButton(): ReactElement {
  const loaderData = useRouteLoaderData("root");
  if (loaderData) {
    const data = loaderData as DiscordUser;
    return (
      <div className="dropdown-end dropdown">
        <button tabIndex={0} className="btn-ghost btn-square btn">
          <Avatar.Root className="avatar m-1 h-10 w-10">
            <Avatar.Image
              className="rounded-full"
              src={data.avatar}
              alt="avatar"
            />
            <Avatar.Fallback delayMs={600}>
              <img
                className="rounded-full"
                src={`https://cdn.discordapp.com/embed/avatars/${
                  // pomelo 🍊
                  data.username.length % 5
                }.png`}
                alt="avatar"
              />
            </Avatar.Fallback>
          </Avatar.Root>
        </button>
        <ul
          tabIndex={0}
          className="dropdown-content menu rounded-box mt-4 w-52 bg-base-100 p-2 shadow"
        >
          <li className="menu-title !opacity-100">
            <span className="text-sm">
              Logged in as:{" "}
              {`${data.username}
              (${data.id})`}
            </span>
          </li>
          <li className="divider" />
          <li>
            <Link to="/dashboard">
              <MdOutlineSpaceDashboard className="mr-2 inline-block h-5 w-5" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/logout"
              className="text-error hover:bg-error hover:text-secondary-content"
            >
              <MdLogout className="mr-2 inline-block h-5 w-5" />
              Logout
            </Link>
          </li>
        </ul>
      </div>
    );
  }
  return (
    <Link to="/login" className="btn-ghost btn">
      <MdLogin className="mr-2 inline-block h-5 w-5" />
      Login
    </Link>
  );
}
