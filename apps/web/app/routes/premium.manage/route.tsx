import type { Database } from "@dougley/d1-database";
import type { ActionFunction } from "@remix-run/cloudflare";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { Authenticator } from "remix-auth";
import Stripe from "stripe";
import type { DiscordUser } from "~/services/authenticator.server";

export const action: ActionFunction = async ({ context, request }) => {
  const body = await request.formData();
  const returnPath = body.get("returnPath");
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: context.D1 as D1Database }),
  });
  const stripe = new Stripe(context.STRIPE_SECRET_KEY as string, {
    httpClient: Stripe.createFetchHttpClient(),
  });
  const user = (await (context.authenticator as Authenticator).isAuthenticated(
    request,
    {
      failureRedirect: "/login",
    },
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
    return_url: `${new URL(request.url).origin}/${returnPath ?? ""}`,
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: session.url,
    },
  });
};
