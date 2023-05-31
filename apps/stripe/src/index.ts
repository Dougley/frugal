import type { Database } from "@dougley/d1-database";
import { Hono } from "hono";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import Stripe from "stripe";

export const webCrypto = Stripe.createSubtleCryptoProvider();

const app = new Hono<{
  Bindings: Env & {
    STRIPE_WEBHOOK_SECRET: string;
    STRIPE_SECRET_KEY: string;
    PREMIUM_PRODUCT_ID: string;
    PLUS_PRODUCT_ID: string;
  };
}>();

app.post("/webhook", async (c) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
  });
  const body = await c.req.text();
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: c.env.D1 }),
  });
  let event: Stripe.Event = JSON.parse(body);
  if (c.env.STRIPE_WEBHOOK_SECRET) {
    const signature = c.req.headers.get("stripe-signature")!;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        c.env.STRIPE_WEBHOOK_SECRET,
        undefined,
        webCrypto
      );
    } catch (err) {
      console.log("Invalid signature", err);
      return c.text("Invalid signature", 400);
    }
  } else {
    console.log(
      "STRIPE_WEBHOOK_SECRET not set, skipping signature verification. This is incredibly insecure and should only be used for testing."
    );
  }
  console.log("Received event", event.type);
  switch (event.type) {
    case "customer.subscription.created": {
      // since we cant get the discord id from the subscription object, just assume we'll get it later from checkout.session.completed
      const subscription = event.data.object as Stripe.Subscription;
      const exists = await db
        .selectFrom("premium_subscriptions")
        .selectAll()
        .where("stripe_customer_id", "=", subscription.customer as string)
        .execute();
      if (exists.length > 0) {
        await db
          .updateTable("premium_subscriptions")
          .set({
            subscription_tier:
              subscription.items.data[0].plan.product ===
              c.env.PREMIUM_PRODUCT_ID
                ? "premium"
                : "basic",
            stripe_subscription_id: subscription.id,
            updated_at: new Date(subscription.created * 1000).toISOString(),
          })
          .where("stripe_customer_id", "=", subscription.customer as string)
          .execute();
      } else {
        await db
          .insertInto("premium_subscriptions")
          .values({
            subscription_tier:
              subscription.items.data[0].plan.product ===
              c.env.PREMIUM_PRODUCT_ID
                ? "premium"
                : "basic",
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            created_at: new Date(subscription.created * 1000).toISOString(),
            updated_at: new Date(subscription.created * 1000).toISOString(),
          })
          .execute();
      }
      return c.text("OK");
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(
        subscription.items.data[0].plan.product,
        "should be",
        subscription.items.data[0].plan.product === c.env.PREMIUM_PRODUCT_ID
          ? "premium"
          : "basic"
      );
      // subscriptions update when they are canceled, or when someone changes plans
      await db
        .updateTable("premium_subscriptions")
        .set({
          active: ["active", "trialing"].includes(subscription.status) ? 1 : 0,
          subscription_tier:
            subscription.items.data[0].plan.product === c.env.PREMIUM_PRODUCT_ID
              ? "premium"
              : "basic",
        })
        .where("stripe_subscription_id", "=", subscription.id)
        .execute();
      return c.text("OK");
    }
    case "customer.subscription.deleted": {
      // dont delete the subscription from the database, just mark it as inactive
      // we can reuse their customer id if they resubscribe
      const subscription = event.data.object as Stripe.Subscription;
      await db
        .updateTable("premium_subscriptions")
        .where("stripe_subscription_id", "=", subscription.id)
        .set({
          active: 0,
        })
        .execute();
      return c.text("OK");
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      await db
        .updateTable("premium_subscriptions")
        .set({
          active: invoice.paid ? 1 : 0,
        })
        .where("stripe_subscription_id", "=", invoice.subscription as string)
        .execute();
      return c.text("OK");
    }
    case "checkout.session.completed": {
      // we can somewhat reasonably assume that they have a subscription that we know about at this point
      const session = event.data.object as Stripe.Checkout.Session;
      await db
        .updateTable("premium_subscriptions")
        .set({
          discord_user_id: session.client_reference_id as string,
        })
        .where("stripe_customer_id", "=", session.customer as string)
        .execute();
      return c.text("OK");
    }
    default: {
      console.log("Unhandled event type", event.type);
      return c.text("Unhandled event type", 400);
    }
  }
});

export default app;
