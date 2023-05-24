import * as Avatar from "@radix-ui/react-avatar";
import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { sub } from "date-fns";
import { GiPartyPopper } from "react-icons/gi";
import { IoMdArrowBack } from "react-icons/io";
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
  const since = new Intl.DateTimeFormat("en-GB").format(
    sub(new Date(), {
      months: 3,
    })
  );
  const isPremium = false; // TODO: check if user is premium
  return (
    <div className="flex min-h-screen flex-col justify-center overflow-x-auto">
      <h1 className="m-5 text-center text-4xl font-semibold">Your profile</h1>
      <div className="pb-5">
        <Link to="/dashboard">
          <button className="btn m-auto flex">
            <IoMdArrowBack className="mr-2 h-6 w-6 flex-shrink-0" />
            Back to dashboard
          </button>
        </Link>
      </div>
      <div className="flex flex-row flex-wrap justify-center">
        <div className="card m-4 h-auto w-auto bg-base-300 p-4 normal-case shadow-xl">
          <div className="flex flex-row items-center">
            <Avatar.Root className="h-32 w-32">
              <Avatar.Image
                className="rounded-full"
                src={user.avatar}
                alt={user.username}
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
            <div className="ml-5">
              <p className="text-2xl font-semibold">{user.username}</p>
              <p className="text-xs">#{user.discriminator}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col justify-center lg:flex-row">
            <div className="card-body">
              <h3 className="card-title">Stats</h3>
              <div className="stats stats-vertical shadow">
                <div className="stat">
                  <div className="stat-title">Giveaways won</div>
                  {/* TODO: get giveaways won */}
                  <div className="stat-value">0</div>
                  <div className="stat-desc">Since {since}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Giveaways entered</div>
                  {/* TODO: get giveaways entered */}
                  <div className="stat-value">0</div>
                  <div className="stat-desc">Since {since}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Giveaways hosted</div>
                  {/* TODO: get giveaways hosted */}
                  <div className="stat-value">0</div>
                  <div className="stat-desc">Since {since}</div>
                </div>
              </div>
            </div>
            <div className="divider lg:divider-horizontal" />
            <div className="card-body">
              <h3 className="card-title">Traits</h3>
              <div className="badge-accent badge badge-md">Beta Tester</div>
              <div className="badge-secondary badge badge-md">
                Premium Subscriber
              </div>
              <div className="badge-primary badge badge-md">
                GiveawayBot Staff
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row flex-wrap justify-center">
        <Link
          to="/premium"
          className={
            "card btn m-4 h-auto w-80 p-4 normal-case shadow-xl lg:w-96" +
            (!isPremium ? " btn-secondary" : "")
          }
        >
          <figure>
            <div>
              <GiPartyPopper className="h-16 w-16" />
            </div>
            <figcaption className="p-4">
              <p className="text-xl font-semibold">GiveawayBot Premium</p>
              <p className="text-xs">
                {!isPremium
                  ? "Get access to premium features and support the development of this project!"
                  : "Thanks for subscribing to GiveawayBot Premium! Click here to manage your subscription."}
              </p>
            </figcaption>
          </figure>
        </Link>
      </div>
    </div>
  );
}
