import { Link, useRouteLoaderData } from "@remix-run/react";
import type { ReactElement } from "react";
import { MdLogin, MdLogout } from "react-icons/md";
import type { DiscordUser } from "~/services/authenticator.server";

export function ProfileButton(): ReactElement {
  const loaderData = useRouteLoaderData("root");
  if (loaderData !== null) {
    const data = loaderData as DiscordUser;
    return (
      <div className="dropdown-end dropdown">
        <button tabIndex={0} className="avatar">
          <div className="m-1 h-10 w-10 rounded-full">
            <img alt="avatar" src={data.avatar} />
          </div>
        </button>
        <ul
          tabIndex={0}
          className="dropdown-content menu rounded-box mt-4 w-52 bg-base-100 p-2 shadow"
        >
          <li className="menu-title">
            <p className="text-sm">
              Logged in as:{" "}
              {`${data.username}
              (${data.id})`}
            </p>
          </li>
          <li className="divider" />
          {/* <li>
            <Link to="/dashboard">
              <MdOutlineSpaceDashboard className="mr-2 inline-block h-5 w-5" />
              Dashboard
            </Link>
          </li> */}
          <li className="text-error">
            <Link to="/logout">
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
