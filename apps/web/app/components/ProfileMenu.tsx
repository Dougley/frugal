import * as Avatar from "@radix-ui/react-avatar";
import { Link, useRouteLoaderData } from "@remix-run/react";
import type { ReactElement } from "react";
import { LuLogIn, LuLogOut } from "react-icons/lu";
import type { DiscordUser } from "~/services/authenticator.server";

export function ProfileMenu({
  toggleDrawer,
}: {
  toggleDrawer: () => void;
}): ReactElement {
  const { user } = useRouteLoaderData("root") as {
    user: DiscordUser | null;
  };
  if (user) {
    return (
      <>
        <Link to="/profile" onClick={toggleDrawer}>
          <button tabIndex={0} className="btn-ghost btn">
            <Avatar.Root className="avatar h-10 w-10">
              <Avatar.Image
                className="rounded-full"
                src={user.avatar}
                alt="avatar"
              />
              <Avatar.Fallback delayMs={600}>
                <img
                  className="rounded-full"
                  src={`https://cdn.discordapp.com/embed/avatars/${
                    // pomelo 🍊
                    Math.abs(((user.id as any) >> 22) % 5)
                  }.png`}
                  alt="avatar"
                />
              </Avatar.Fallback>
            </Avatar.Root>
            <span className="ml-2 normal-case">{user.displayName}</span>
          </button>
        </Link>
        <Link
          to="/logout"
          className="btn-ghost btn-square btn text-error hover:bg-error hover:text-secondary-content"
          onClick={toggleDrawer}
        >
          <LuLogOut className="h-5 w-5" />
        </Link>
      </>
    );
  }
  return (
    <Link to="/login" className="btn-ghost btn" onClick={toggleDrawer}>
      <LuLogIn className="mr-2 inline-block h-5 w-5" />
      Login
    </Link>
  );
}
