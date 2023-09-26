import type { Database } from "@dougley/d1-database";
import * as Avatar from "@radix-ui/react-avatar";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { sub } from "date-fns";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { LuGem, LuPartyPopper } from "react-icons/lu";
import type { Authenticator } from "remix-auth";
import type { DiscordUser } from "~/services/authenticator.server";
import { defaultMeta } from "~/utils/meta";

export const meta: MetaFunction = () => {
  return defaultMeta();
};

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: context.D1 as D1Database }),
  });
  const user = (await (context.authenticator as Authenticator).isAuthenticated(
    request,
    {
      failureRedirect: "/login",
    },
  )) as DiscordUser;
  return {
    user,
    premiumSubscription: await db
      .selectFrom("premium_subscriptions")
      .where("discord_user_id", "=", user.id)
      .select(["active", "subscription_tier"])
      .executeTakeFirst(),
    stats: {
      hosted: await db
        .selectFrom("giveaways")
        .where("host_id", "=", user.id)
        .select(({ fn }) => fn.count<number>("message_id").as("count"))
        .executeTakeFirst(),
      entered: await db
        .selectFrom("entries")
        .where("user_id", "=", user.id)
        .select(({ fn }) => fn.count<number>("giveaway_id").as("count"))
        .executeTakeFirst(),
      won: await db
        .selectFrom("entries")
        .where("user_id", "=", user.id)
        .where("winner", "=", 1)
        .select(({ fn }) => fn.count<number>("giveaway_id").as("count"))
        .executeTakeFirst(),
    },
  };
};

export default function Index() {
  const { user, premiumSubscription, stats } = useLoaderData() as {
    user: DiscordUser;
    premiumSubscription:
      | {
          active: 1 | 0;
          subscription_tier: "basic" | "premium" | "free";
        }
      | undefined;
    stats: {
      hosted: { count: number } | undefined;
      entered: { count: number } | undefined;
      won: { count: number } | undefined;
    };
  };
  const since = new Intl.DateTimeFormat("en-GB").format(
    sub(new Date(), {
      months: 3,
    }),
  );
  const isPremium = premiumSubscription?.active === 1;
  const traits = [];
  if (isPremium) {
    traits.push(
      <div className="badge badge-lg flex flex-row items-center">
        <LuGem className="mr-2 text-xl" />
        <p className="text-xl font-semibold">
          {premiumSubscription?.subscription_tier
            ? `${premiumSubscription?.subscription_tier
                .charAt(0)
                .toUpperCase()}${premiumSubscription?.subscription_tier.slice(
                1,
              )}`
            : "Free"}
        </p>
      </div>,
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center overflow-x-auto">
      <h1 className="m-5 text-center text-4xl font-semibold">Your profile</h1>
      <div className="flex flex-row flex-wrap justify-center">
        <div className="card m-4 flex flex-row items-center bg-base-300 p-4 shadow-xl">
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
            <p className="text-2xl font-semibold">{user.displayName}</p>
            <p className="text-xs">
              {user.discriminator
                ? `${user.username}#${user.discriminator}`
                : `@${user.username}`}
            </p>
            <p className="text-xs">ID: {user.id}</p>
          </div>
        </div>
        <div className="card m-4 h-auto w-full bg-base-300 p-4 normal-case shadow-xl">
          <div className="mt-5 flex flex-col justify-center lg:flex-row">
            <div className="card-body">
              <h3 className="card-title">Stats</h3>
              <div className="stats stats-vertical shadow">
                <div className="stat">
                  <div className="stat-title">Giveaways won</div>
                  <div className="stat-value">
                    {stats.won?.count.toLocaleString()}
                  </div>
                  <div className="stat-desc">Since {since}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Giveaways entered</div>
                  <div className="stat-value">
                    {stats.entered?.count.toLocaleString()}
                  </div>
                  <div className="stat-desc">Since {since}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Giveaways hosted</div>
                  <div className="stat-value">
                    {stats.hosted?.count.toLocaleString()}
                  </div>
                  <div className="stat-desc">Since {since}</div>
                </div>
              </div>
            </div>
            <div className="divider lg:divider-horizontal" />
            <div className="card-body">
              <h3 className="card-title">Traits</h3>
              {traits.length ? (
                <div className="badge-group">
                  {traits.map((trait) => trait)}
                </div>
              ) : (
                <div className="my-auto flex place-self-center">
                  <div className="my-auto content-center text-center">
                    <LuPartyPopper className="mx-auto h-12 w-12" />
                    <h2 className="text-2xl font-semibold">
                      No traits to show
                    </h2>
                    <p className="opacity-50">
                      Nothing here but us chickens, try again later.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row flex-wrap justify-center">
        {isPremium ? (
          <Form action="/premium/manage" method="post">
            <input type="hidden" name="returnPath" value="profile" />
            <button className="btn card m-4 h-auto w-80 p-4 normal-case shadow-xl lg:w-96">
              <figure>
                <div>
                  <LuPartyPopper className="h-16 w-16" />
                </div>
                <figcaption className="p-4">
                  <p className="text-xl font-semibold">Manage subscription</p>
                  <p className="text-xs">
                    Thanks for subscribing! Click here to manage your
                    subscription.
                  </p>
                </figcaption>
              </figure>
            </button>
          </Form>
        ) : (
          <Link to="/premium">
            <button className="card btn-secondary m-4 h-auto w-80 p-4 normal-case shadow-xl lg:w-96">
              <figure>
                <div>
                  <LuGem className="h-16 w-16" />
                </div>
                <figcaption className="p-4">
                  <p className="text-xl font-semibold">GiveawayBot Premium</p>
                  <p className="text-xs">
                    Get access to premium features and support the development
                    of this project!
                  </p>
                </figcaption>
              </figure>
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
