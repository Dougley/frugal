import type { Database } from "@dougley/d1-database";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { defer, redirect } from "@remix-run/cloudflare";
import { Await, useLoaderData } from "@remix-run/react";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { Suspense, useEffect } from "react";
import { toast } from "react-hot-toast";
import type { Authenticator } from "remix-auth";
import Stripe from "stripe";
import type { DiscordUser } from "~/services/authenticator.server";
import { defaultMeta } from "~/utils/meta";
import ComparisonTable from "./components/ComparisonTable";
import FAQ from "./components/FAQ";
import { ShowcaseItem } from "./components/ShowcaseItem";
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
    expand: ["data.currency_options", "data.product"],
    product: context.SUBSCRIPTION_PLUS_PRODUCT_ID as string,
    type: "recurring",
  });

  const premiumPrices = await stripe.prices.list({
    active: true,
    expand: ["data.currency_options", "data.product"],
    product: context.SUBSCRIPTION_PREMIUM_PRODUCT_ID as string,
    type: "recurring",
  });

  const ultraPrices = await stripe.prices.list({
    active: true,
    expand: ["data.currency_options", "data.product"],
    product: context.SUBSCRIPTION_ULTRA_PRODUCT_ID as string,
    type: "recurring",
  });

  return defer({
    loggedIn: !!user,
    alreadyPremium: alreadyPremium?.active ?? false,
    pricing: {
      plus: plusPrices,
      premium: premiumPrices,
      ultra: ultraPrices,
    },
  });
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
    subscription_data:{
      metadata: {
        discord_user_id: user.id,
      },
      trial_settings: {
        end_behavior:{
          missing_payment_method: "cancel",
        }
      }
    },
    payment_method_collection: "if_required",
    allow_promotion_codes: true,
    customer_update: {
      address: "auto",
      name: "auto",
    },
    customer: customerId?.stripe_customer_id,
  });
  return redirect(session.url!, {
    headers: {
      "Cache-Control": "no-cache",
    },
  });
};

export default function Index() {
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
  const { pricing } = useLoaderData<typeof loader>();
  return (
    <div className="flex min-h-screen flex-col justify-center overflow-x-auto">
      <div className="hero min-h-[40vh]">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-black">
              GiveawayBot <span className="text-secondary">Premium</span>
            </h1>
            <p className="mt-5 text-xl">
              Unlock the full potential of GiveawayBot with Premium!
            </p>
            <div className="flex flex-row flex-wrap justify-center">
              <Suspense fallback={<div className="btn btn-disabled">...</div>}>
                <Await resolve={pricing.plus}>
                  <StripeRedirectModal />
                </Await>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="mx-auto w-full max-w-[1240px] xl:p-6">
          <ShowcaseItem
            image="https://placehold.co/600x400"
            title="More time, more winners"
          >
            <p className="mb-5">
              The fun doesn't have to end after 2 weeks! With Premium, you can
              extend your giveaways up to 8 weeks (56 days) and have up to 100
              winners!
            </p>
            <div className="flex flex-row flex-wrap">
              <span>
                <div className="badge badge-outline mx-1">Plus</div> 4 weeks (30
                days), 30 winners
              </span>
              <span>
                <div className="badge badge-secondary badge-outline mx-1">
                  Premium
                </div>
                6 weeks (42 days), 50 winners
              </span>
              <span>
                <div className="badge badge-accent badge-outline mx-1">
                  Ultra
                </div>
                8 weeks (56 days), 100 winners
              </span>
            </div>
          </ShowcaseItem>
        </div>
        <div className="mx-auto w-full max-w-[1240px] xl:p-6">
          <ShowcaseItem
            image="https://placehold.co/600x400"
            title="Generate more hype"
          >
            <p className="mb-5">
              Why limit yourself to only 10 giveaways at once? With Premium, you
              can run up to 50 giveaways per channel! That's 5x the fun! Your
              members will love you for it.
            </p>
            <div className="flex flex-row flex-wrap">
              <span>
                <div className="badge badge-outline mx-1">Plus</div> 10
                giveaways per channel
              </span>
              <span>
                <div className="badge badge-secondary badge-outline mx-1">
                  Premium
                </div>
                25 giveaways per channel
              </span>
              <span>
                <div className="badge badge-accent badge-outline mx-1">
                  Ultra
                </div>
                50 giveaways per channel
              </span>
            </div>
          </ShowcaseItem>
        </div>
        <div className="mx-auto w-full max-w-[1240px] xl:p-6">
          <ShowcaseItem
            image="https://placehold.co/600x400"
            title="Supercharge your analytics"
          >
            <p className="mb-5">
              Premium means going pro with your giveaways. Dive deep into
              advanced analytics that reveal the secret sauce behind your most
              successful contests. Numbers, graphs, and insights that'll make
              your data-loving heart skip a beat!
            </p>
            <span>
              Available on:
              <div className="badge badge-secondary badge-outline mx-1">
                Premium
              </div>
              <div className="badge badge-accent badge-outline mx-1">Ultra</div>
            </span>
          </ShowcaseItem>
        </div>
        <div className="mx-auto w-full max-w-[1240px] xl:p-6">
          <ShowcaseItem
            image="https://placehold.co/600x400"
            title="Show off your server's style"
          >
            <p className="mb-5">
              Give your giveaways a personal touch with custom themes and
              emojis. Whether it's a pirate-themed treasure hunt or a space
              adventure, premium users can theme it up and emojify the
              excitement!
            </p>
            <span>
              Available on:
              <div className="badge badge-outline mx-1">Plus</div>
              <div className="badge badge-secondary badge-outline mx-1">
                Premium
              </div>
              <div className="badge badge-accent badge-outline mx-1">Ultra</div>
            </span>
          </ShowcaseItem>
        </div>
        <div className="mx-auto w-full max-w-[1240px] xl:p-6">
          <ShowcaseItem
            image="https://placehold.co/600x400"
            title="Instant gratification"
          >
            <p className="mb-5">
              Why spend time managing and sending out prizes when you can have
              GiveawayBot do it for you? Premium users enjoy the convenience of
              automatic prize delivery. Let us take care of distributing prizes
              to the lucky winners, making your life easier and your giveaways
              smoother.
            </p>
            <span>
              Available on:
              <div className="badge badge-accent badge-outline mx-1">Ultra</div>
            </span>
          </ShowcaseItem>
        </div>
        <div className="mx-auto w-full max-w-[1240px] xl:p-6">
          <ShowcaseItem
            image="https://placehold.co/600x400"
            title="Save all the things!"
          >
            <p className="mb-5">
              With longer giveaways and more winners, we know you'll want to
              keep track of all the data. Premium users have access to longer
              giveaway history and more detailed analytics to help you make the
              most of your giveaways!
            </p>
            <span>
              Available on:
              <div className="badge badge-secondary badge-outline mx-1">
                Premium
              </div>
              <div className="badge badge-accent badge-outline mx-1">Ultra</div>
            </span>
          </ShowcaseItem>
        </div>
      </div>
      <div className="flex flex-row flex-wrap justify-center">
        <ComparisonTable />
      </div>
      <div className="flex w-full flex-col items-center justify-center">
        <h2 className="text-center text-3xl font-bold">
          Frequently asked questions
        </h2>
        <div className="my-8 flex w-full max-w-5xl flex-col items-start rounded-2xl bg-base-300 p-2 md:flex-row">
          <FAQ />
        </div>
      </div>
      <div className="hero min-h-[40vh]">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h2 className="mb-8 text-center text-4xl font-black">
              What are you waiting for?
            </h2>
            <span className="text-xl">
              Plans start at just{" "}
              <Suspense fallback={<div>...</div>}>
                <Await resolve={pricing.plus}>
                  <span className="font-bold text-secondary">
                    {(() => {
                      let price = pricing.plus.data.reduce((prev, current) =>
                        prev.unit_amount! < current.unit_amount!
                          ? prev
                          : current,
                      );
                      return new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: price.currency!,
                        currencyDisplay: "symbol",
                      }).format(price.unit_amount! / 100);
                    })()}
                  </span>
                  !
                </Await>
              </Suspense>
            </span>
            <div className="mt-4 flex flex-row flex-wrap justify-center">
              <Suspense fallback={<div className="btn btn-disabled">...</div>}>
                <Await resolve={pricing.plus}>
                  <StripeRedirectModal />
                </Await>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
