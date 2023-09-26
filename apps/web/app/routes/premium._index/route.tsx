import type { Database } from "@dougley/d1-database";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { useEffect } from "react";
import { toast } from "react-hot-toast";
import type { Authenticator } from "remix-auth";
import Stripe from "stripe";
import type { DiscordUser } from "~/services/authenticator.server";
import { defaultMeta } from "~/utils/meta";
import FreeFeaturesCard from "./components/FreeFeaturesCard";
import PlusFeaturesCard from "./components/PlusFeaturesCard";
import PremiumFeaturesCard from "./components/PremiumFeaturesCard";
import PricingDisclosure from "./components/Pricing";
import StripeClimateBadge from "./components/StripeClimateBadge";
import StripeRedirectModal from "./components/StripeRedirectModal";

export const meta: MetaFunction = () => {
  return defaultMeta();
};

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const user = (await (context.authenticator as Authenticator).isAuthenticated(
    request,
  )) as DiscordUser | null;
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: context.D1 as D1Database }),
  });
  const stripe = new Stripe(context.STRIPE_SECRET_KEY as string, {
    apiVersion: "2023-08-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const alreadyPremium = user
    ? await db
        .selectFrom("premium_subscriptions")
        .select(["active"])
        .where("discord_user_id", "=", user.id)
        .executeTakeFirst()
    : {
        active: false,
      };

  const plusPrices = await stripe.prices.list({
    active: true,
    expand: ["data.currency_options"],
    product: context.SUBSCRIPTION_PREMIUM_PRODUCT_ID as string,
    type: "recurring",
  });

  const premiumPrices = await stripe.prices.list({
    active: true,
    expand: ["data.currency_options"],
    product: context.SUBSCRIPTION_PREMIUM_PRODUCT_ID as string,
    type: "recurring",
  });

  const plusYearlyPrice = plusPrices.data.find(
    (price) => price.recurring!.interval === "year",
  )!;
  const plusMonthlyPrice = plusPrices.data.find(
    (price) => price.recurring!.interval === "month",
  )!;
  const premiumYearlyPrice = premiumPrices.data.find(
    (price) => price.recurring!.interval === "year",
  )!;
  const premiumMonthlyPrice = premiumPrices.data.find(
    (price) => price.recurring!.interval === "month",
  )!;

  return {
    loggedIn: !!user,
    alreadyPremium: alreadyPremium?.active ?? false,
    plus: plusMonthlyPrice.id,
    premium: premiumMonthlyPrice.id,
    pricing: {
      premium: {
        yearly: premiumYearlyPrice,
        monthly: premiumMonthlyPrice,
      },
      plus: {
        yearly: plusYearlyPrice,
        monthly: plusMonthlyPrice,
      },
    },
  };
}

export const action = async ({ context, request }: ActionFunctionArgs) => {
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: context.D1 as D1Database }),
  });

  const body = await request.formData();
  if (!body || !body.has("priceId")) throw new Error("Parameters missing");

  const stripe = new Stripe(context.STRIPE_SECRET_KEY as string, {
    apiVersion: "2023-08-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const user = (await (context.authenticator as Authenticator).isAuthenticated(
    request,
    {
      failureRedirect: "/login",
    },
  )) as DiscordUser;

  let customerId = await db
    .selectFrom("premium_subscriptions")
    .select(["stripe_customer_id"])
    .where("discord_user_id", "=", user.id)
    .executeTakeFirst();
  if (!customerId?.stripe_customer_id) {
    const customer = await stripe.customers.create({
      metadata: {
        discord_user_id: user.id,
      },
    });
    const data = await db
      .insertInto("premium_subscriptions")
      .values({
        discord_user_id: user.id,
        stripe_customer_id: customer.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning(["stripe_customer_id"])
      .executeTakeFirst();
    customerId = data;
  }
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: body.get("priceId") as string,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: request.url + "/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: request.url + "?result=canceled",
    // locale: "en",
    automatic_tax: {
      enabled: true,
    },
    allow_promotion_codes: true,
    customer_update: {
      address: "auto",
      name: "auto",
    },
    billing_address_collection: "required",
    customer: customerId?.stripe_customer_id,
  });
  return redirect(session.url!, {
    headers: {
      "Cache-Control": "no-cache",
    },
  });
};

export default function Index() {
  const { plus, premium, alreadyPremium, pricing, loggedIn } = useLoaderData<{
    plus: string;
    premium: string;
    alreadyPremium: boolean;
    pricing: {
      premium: {
        yearly: Stripe.Price;
        monthly: Stripe.Price;
      };
      plus: {
        yearly: Stripe.Price;
        monthly: Stripe.Price;
      };
    };
    loggedIn: boolean;
  }>();
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
            <h1 className="text-5xl font-black">
              GiveawayBot <span className="text-secondary">Premium</span>
            </h1>
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
          For <span className="font-bold">all servers you own</span>:
        </p>
      </div>
      <div className="m-5 flex flex-col flex-wrap items-center justify-center lg:flex-row">
        <PricingDisclosure pricing={pricing.premium.monthly} />
        <div className="divider lg:divider-horizontal">OR</div>
        <PricingDisclosure pricing={pricing.premium.yearly} />
      </div>
      <div className="flex flex-col flex-wrap justify-center">
        <p className="text-center text-sm">
          We donate 1% of all proceeds to
          <a
            href="https://climate.stripe.com/GhYWr6"
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
        {loggedIn ? (
          !alreadyPremium ? (
            <StripeRedirectModal priceId={premium} />
          ) : (
            <Form action="/premium/manage" method="post">
              <input type="hidden" name="returnPath" value="premium" />
              <div className="rounded-box m-2 flex flex-col flex-wrap justify-center border border-base-300 bg-base-200 p-5">
                <p className="text-center text-xl">
                  You're already subscribed!
                </p>
                <button className="btn btn-primary m-2 w-auto">
                  Manage subscription
                </button>
              </div>
            </Form>
          )
        ) : (
          <Link to="/login" className="btn m-2 w-auto">
            Login to subscribe
          </Link>
        )}
      </div>
      <div className="mb-5 flex flex-row flex-wrap items-center justify-center">
        <div className="collapse collapse-arrow rounded-box w-auto border border-base-300">
          <input type="checkbox" />
          <div className="collapse-title font-medium">
            Prefer to keep things simple? You can also subscribe to Plus
          </div>
          <div className="collapse-content">
            <PlusFeaturesCard />
            <div className="flex flex-row flex-wrap justify-center">
              <p className="text-center text-xl">
                For <span className="font-bold">all servers you own</span>:
              </p>
            </div>
            <div className="m-5 flex flex-col flex-wrap justify-center lg:flex-row">
              <PricingDisclosure pricing={pricing.plus.monthly} />
              <div className="divider lg:divider-horizontal">OR</div>
              <PricingDisclosure pricing={pricing.plus.yearly} />
            </div>
            <div className="flex flex-col flex-wrap justify-center">
              <p className="text-center text-sm">
                We donate 1% of all proceeds to
                <a
                  href="https://climate.stripe.com/GhYWr6"
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
              {loggedIn ? (
                !alreadyPremium ? (
                  <StripeRedirectModal priceId={plus} />
                ) : (
                  <Form action="/premium/manage" method="post">
                    <input type="hidden" name="returnPath" value="premium" />
                    <div className="rounded-box m-2 flex flex-col flex-wrap justify-center border border-base-300 bg-base-200 p-5">
                      <p className="text-center text-xl">
                        You're already subscribed!
                      </p>
                      <button className="btn btn-primary m-2 w-auto">
                        Manage subscription
                      </button>
                    </div>
                  </Form>
                )
              ) : (
                <Link to="/login" className="btn m-2 w-auto">
                  Login to subscribe
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row flex-wrap justify-center">
        <p className="mt-2 text-xs opacity-50">
          By subscribing, you agree to our{" "}
          <Link
            to="https://dougley.com/discord/terms"
            className="link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </Link>{" "}
          ,{" "}
          <Link
            to="https://dougley.com/discord/privacy"
            className="link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </Link>
          , and{" "}
          <Link
            to="https://dougley.com/discord/paid-services"
            className="link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Paid Services Agreement
          </Link>
        </p>
      </div>
    </div>
  );
}
