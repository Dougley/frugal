import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { BsPersonBadge } from "react-icons/bs";
import { GiPartyPopper } from "react-icons/gi";
import { HiServer } from "react-icons/hi";
import type { Authenticator } from "remix-auth";
import type { DiscordUser } from "~/services/authenticator.server";
import { defaultMeta } from "~/utils/meta";

export const meta: V2_MetaFunction = () => {
  return defaultMeta();
};

export const loader = async ({ context, request }: LoaderArgs) => {
  return (context.authenticator as Authenticator).isAuthenticated(request, {
    failureRedirect: "/login",
  });
};

export default function Index() {
  const user = useLoaderData() as DiscordUser;
  return (
    <div className="flex min-h-screen flex-col justify-center overflow-x-auto">
      <h1 className="m-5 text-center text-4xl font-semibold">
        Hi {user.username}!
      </h1>
      <p className="m-5 text-center text-xl">
        Welcome to the GiveawayBot Dashboard! Here you can manage your
        giveaways, servers, and your account.
      </p>
      <div className="flex flex-row flex-wrap justify-center">
        <Link
          to="/dashboard/giveaways"
          className="btn-disabled card btn-ghost btn m-4 h-auto w-80 bg-base-300 p-4 normal-case shadow-xl"
        >
          <figure>
            <div>
              <GiPartyPopper className="h-16 w-16" />
            </div>
            <figcaption className="p-4">
              <p className="text-xl font-semibold">Giveaways</p>
              <p className="text-xs">
                See all the giveaways you've created or entered.
              </p>
            </figcaption>
          </figure>
        </Link>
        <Link
          to="/dashboard/guilds"
          className="card btn-ghost btn m-4 h-auto w-80 bg-base-300 p-4 normal-case shadow-xl"
        >
          <figure>
            <div>
              <HiServer className="h-16 w-16" />
            </div>
            <figcaption className="p-4">
              <p className="text-xl font-semibold">Servers</p>
              <p className="text-xs">
                See giveaways in the servers you own or manage.
              </p>
            </figcaption>
          </figure>
        </Link>
        <Link
          to="/dashboard/profile"
          className="card btn-ghost btn m-4 h-auto w-80 bg-base-300 p-4 normal-case shadow-xl"
        >
          <figure>
            <div>
              <BsPersonBadge className="h-16 w-16" />
            </div>
            <figcaption className="p-4">
              <p className="text-xl font-semibold">My Account</p>
              <p className="text-xs">
                Manage your account, see your profile, and more.
              </p>
            </figcaption>
          </figure>
        </Link>
      </div>
    </div>
  );
}
