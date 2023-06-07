import type { Database } from "@dougley/d1-database";
import * as Avatar from "@radix-ui/react-avatar";
import type { ActionArgs, LoaderArgs } from "@remix-run/cloudflare";
import type { V2_MetaFunction } from "@remix-run/node";
import { Form, Link, useFetcher, useLoaderData } from "@remix-run/react";
import { sub } from "date-fns";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { useEffect } from "react";
import { LuPartyPopper } from "react-icons/lu";
import type { Authenticator } from "remix-auth";
import Stripe from "stripe";
import type { DiscordUser } from "~/services/authenticator.server";
import { defaultMeta } from "~/utils/meta";

export const meta: V2_MetaFunction = () => {
  return defaultMeta();
};

export const loader = async ({ context, request }: LoaderArgs) => {
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: context.D1 as D1Database }),
  });
  const user = (await (context.authenticator as Authenticator).isAuthenticated(
    request,
    {
      failureRedirect: "/login",
    }
  )) as DiscordUser;
  return {
    user,
    premiumSubscription: await db
      .selectFrom("premium_subscriptions")
      .where("discord_user_id", "=", user.id)
      .select(["active", "subscription_tier"])
      .executeTakeFirst(),
  };
};

export const action = async ({ context, request }: ActionArgs) => {
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: context.D1 as D1Database }),
  });
  const stripe = new Stripe(context.STRIPE_SECRET_KEY as string, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
  });
  const user = (await (context.authenticator as Authenticator).isAuthenticated(
    request,
    {
      failureRedirect: "/login",
    }
  )) as DiscordUser;

  const customerId = await db
    .selectFrom("premium_subscriptions")
    .where("discord_user_id", "=", user.id)
    .select("stripe_customer_id")
    .executeTakeFirst();

  if (!customerId) {
    throw new Error("User does not have a Stripe customer ID");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId.stripe_customer_id,
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: session.url,
    },
  });
};

export default function Index() {
  const { user, premiumSubscription } = useLoaderData() as {
    user: DiscordUser;
    premiumSubscription:
      | {
          active: 1 | 0;
          subscription_tier: "basic" | "premium" | "free";
        }
      | undefined;
  };
  const since = new Intl.DateTimeFormat("en-GB").format(
    sub(new Date(), {
      months: 3,
    })
  );
  const isPremium = premiumSubscription?.active === 1;
  const fetcher = useFetcher();
  useEffect(() => {
    if (fetcher.data) {
      open(fetcher.data.url, "_blank");
    }
  }, [fetcher.data]);

  return (
    <div className="flex min-h-screen flex-col justify-center overflow-x-auto">
      <h1 className="m-5 text-center text-4xl font-semibold">Your profile</h1>
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
              <p className="text-2xl font-semibold">{user.displayName}</p>
              <p className="text-xs">
                {user.discriminator
                  ? `${user.username}#${user.discriminator}`
                  : `@${user.username}`}
              </p>
              <p className="text-xs">ID: {user.id}</p>
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
              {premiumSubscription?.active &&
                (premiumSubscription?.subscription_tier === "premium" ? (
                  <div className="badge badge-primary badge-md">
                    Premium Subscriber
                  </div>
                ) : (
                  <div className="badge badge-accent badge-md">
                    Plus Subscriber
                  </div>
                ))}
              {/* <div className="badge-primary badge badge-md">
                GiveawayBot Staff
              </div> */}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row flex-wrap justify-center">
        {isPremium ? (
          <Form
            action="/profile"
            method="post"
            onSubmit={(e) => {
              e.preventDefault();
              fetcher.submit(e.currentTarget);
            }}
          >
            <button className="card btn m-4 h-auto w-80 p-4 normal-case shadow-xl lg:w-96">
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
            <button className="btn-secondary card m-4 h-auto w-80 p-4 normal-case shadow-xl lg:w-96">
              <figure>
                <div>
                  <LuPartyPopper className="h-16 w-16" />
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
