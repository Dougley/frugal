import * as Avatar from "@radix-ui/react-avatar";
import { Form, Link, useRouteLoaderData } from "@remix-run/react";
import type { ReactElement } from "react";
import { LuLogOut, LuUser } from "react-icons/lu";
import { DiscordUser } from "~/types/DiscordUser";
import { useDrawer } from "./contexts/DrawerContext";

export function ProfileMenu(): ReactElement {
  const { toggleDrawer } = useDrawer();

  const data = useRouteLoaderData<{ loggedIn: DiscordUser | null }>("root");
  if (data && data?.loggedIn) {
    const loggedIn = data.loggedIn;
    return (
      <>
        <div>
          <button tabIndex={0} className="btn btn-ghost">
            <Link
              to="/profile"
              onClick={toggleDrawer}
              className="flex items-center"
            >
              <Avatar.Root className="avatar h-10 w-10">
                <Avatar.Image
                  className="rounded-full"
                  src={loggedIn.avatar}
                  alt="avatar"
                />
                <Avatar.Fallback delayMs={600}>
                  <img
                    className="rounded-full"
                    src={loggedIn.avatar}
                    alt="avatar"
                  />
                </Avatar.Fallback>
              </Avatar.Root>
              <span className="mx-4 normal-case max-w-32 truncate">
                {loggedIn.displayName}
              </span>
            </Link>
          </button>
        </div>
        <div>
          <Form method="post" action="/api/auth/logout">
            <div className="tooltip" data-tip="Logout">
              <button
                type="submit"
                className="btn btn-square btn-ghost text-error hover:bg-error hover:text-secondary-content"
              >
                <LuLogOut className="h-5 w-5" />
              </button>
            </div>
          </Form>
        </div>
      </>
    );
  }
  return (
    <Link to="/login" onClick={toggleDrawer}>
      <button tabIndex={0} className="btn btn-ghost">
        <LuUser className="mr-2 inline-block h-5 w-5" />
        <span>Not Logged In</span>
      </button>
    </Link>
  );
}
