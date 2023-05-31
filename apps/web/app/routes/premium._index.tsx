import type { Database } from "@dougley/d1-database";
import type { LoaderArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import type { ActionArgs, V2_MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { useEffect } from "react";
import { toast } from "react-hot-toast";
import type { Authenticator } from "remix-auth";
import Stripe from "stripe";
import FreeFeaturesCard from "~/components/FreeFeaturesCard";
import PlusFeaturesCard from "~/components/PlusFeaturesCard";
import PremiumFeaturesCard from "~/components/PremiumFeaturesCard";
import StripeClimateBadge from "~/components/StripeClimateBadge";
import StripeRedirectModal from "~/components/StripeRedirectModal";
import type { DiscordUser } from "~/services/authenticator.server";
import { defaultMeta } from "~/utils/meta";

export const meta: V2_MetaFunction = () => {
  return defaultMeta();
};

export async function loader({ request, context, params }: LoaderArgs) {
  const user = (await (context.authenticator as Authenticator).isAuthenticated(
    request,
    {
      failureRedirect: "/login",
    }
  )) as DiscordUser;
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: context.D1 as D1Database }),
  });
  const alreadyPremium = await db
    .selectFrom("premium_subscriptions")
    .select(["active"])
    .where("discord_user_id", "=", user.id)
    .executeTakeFirst();

  return {
    alreadyPremium,
    plus: context.SUBSCRIPTION_PLUS_PRICE_ID,
    premium: context.SUBSCRIPTION_PREMIUM_PRICE_ID,
  };
}

export const action = async ({ context, request }: ActionArgs) => {
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: context.D1 as D1Database }),
  });

  const body = await request.formData();
  if (!body || !body.has("priceId")) throw new Error("Parameters missing");

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
    .select(["stripe_customer_id"])
    .where("discord_user_id", "=", user.id)
    .executeTakeFirst();
  console.log(request.url + "?result=canceled");
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "paypal", "link", "ideal", "sofort"],
    line_items: [
      {
        price: body.get("priceId") as string,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: request.url + "?result=success",
    cancel_url: request.url + "?result=canceled",
    // locale: "en",
    client_reference_id: user.id,
    automatic_tax: {
      enabled: true,
    },
    allow_promotion_codes: true,
    customer: customerId?.stripe_customer_id ?? undefined,
    metadata: {
      user_id: user.id,
    },
  });
  console.log(JSON.stringify(session));
  return redirect(session.url!, {
    headers: {
      "Cache-Control": "no-cache",
    },
  });
};

export default function Index() {
  const { plus, premium, alreadyPremium } = useLoaderData();
  useEffect(() => {
    let q = new URLSearchParams(window.location.search);
    let result = q.get("result");
    if (result === "success") {
      toast.success("Thank you for your purchase!");
    }
    if (result === "canceled") {
      toast.error("Your purchase was canceled.");
    }
  }, []);
  return (
    <div className="flex min-h-screen flex-col justify-center overflow-x-auto">
      <div className="hero">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">GiveawayBot Premium</h1>
            <p className="mt-5 text-xl">
              Unlock the full potential of GiveawayBot with Premium!
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-row flex-wrap justify-center">
        <FreeFeaturesCard />
        <PremiumFeaturesCard />
      </div>
      <div className="flex flex-row flex-wrap justify-center">
        <p className="text-center text-xl">
          Only €5/month or €50/year for all the servers you own!
        </p>
      </div>
      <div className="flex flex-row flex-wrap justify-center">
        <p className="text-center text-sm">
          We donate 1% of all proceeds to
          <a
            href="https://climate.stripe.com/z71csD"
            className="link-hover link m-1"
            target="_blank"
            rel="noreferrer"
          >
            <StripeClimateBadge className="m-1 inline-block h-5 w-5" />
            Stripe Climate
          </a>
        </p>
      </div>
      <div className="flex flex-row flex-wrap justify-center">
        {!alreadyPremium?.active ? (
          <StripeRedirectModal priceId={premium} />
        ) : (
          <div className="rounded-box m-2 flex flex-col flex-wrap justify-center border border-base-300 bg-base-200 p-5">
            <p className="text-center text-xl">You're already subscribed!</p>
            <Link
              to="/dashboard/profile"
              className="btn-primary btn m-2 w-auto"
            >
              Manage subscription
            </Link>
          </div>
        )}
      </div>
      <div className="mb-5 flex flex-row flex-wrap justify-center">
        <div className="collapse-arrow rounded-box collapse border border-base-300">
          <input type="checkbox" />
          <div className="collapse-title font-medium">
            Prefer to keep things simple? You can also subscribe to Plus
          </div>
          <div className="collapse-content">
            <PlusFeaturesCard />
            <p className="text-center">
              €2/month or €20/year for all the servers you own
            </p>
            <p className="text-center text-sm">
              We donate 1% of all proceeds to
              <a
                href="https://climate.stripe.com/z71csD"
                className="link-hover link m-1"
                target="_blank"
                rel="noreferrer"
              >
                <StripeClimateBadge className="m-1 inline-block h-5 w-5" />
                Stripe Climate
              </a>
            </p>
            <div className="flex flex-row flex-wrap justify-center">
              {!alreadyPremium?.active ? (
                <StripeRedirectModal priceId={plus} />
              ) : (
                <div className="rounded-box m-2 flex flex-col flex-wrap justify-center border border-base-300 bg-base-200 p-5">
                  <p className="text-center text-xl">
                    You're already subscribed!
                  </p>
                  <Link
                    to="/dashboard/profile"
                    className="btn-primary btn m-2 w-auto"
                  >
                    Manage subscription
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
