import { drizzleD1 } from "@dougley/frugal-drizzle/workers";
import {
  type DiscordEntitlement,
  ingestEntitlementEvent,
  recordSubscriptionEvent,
} from "@dougley/frugal-subscriptions";
import * as Sentry from "@sentry/cloudflare";
import { ApplicationWebhookType } from "discord-api-types/v10";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { verifyDiscordSignature } from "../utils/discord-verify";

export interface DiscordWebhookEventData {
  type: "ENTITLEMENT_CREATE" | "ENTITLEMENT_UPDATE" | "ENTITLEMENT_DELETE";
  timestamp: string;
  data: DiscordEntitlement;
}

export interface DiscordWebhookEvent {
  version: number;
  application_id: string;
  type: number;
  event: DiscordWebhookEventData;
}

export async function discordMonetizationHandler(
  c: Context<{ Bindings: Env }>
) {
  try {
    const signature = c.req.header("X-Signature-Ed25519");
    const timestamp = c.req.header("X-Signature-Timestamp");

    if (!signature || !timestamp) {
      throw new HTTPException(400, { message: "Missing required headers" });
    }

    const body = await c.req.text();

    if (
      !(await verifyDiscordSignature(
        body,
        signature,
        timestamp,
        c.env.DISCORD_PUBLIC_KEY
      ))
    ) {
      Sentry.addBreadcrumb({
        category: "discord.webhook",
        message: "Invalid signature",
        level: "warning",
      });
      throw new HTTPException(401, { message: "Invalid signature" });
    }

    let event: DiscordWebhookEvent;

    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error("Failed to parse webhook body:", error);
      if (error instanceof Error) {
        Sentry.captureException(error);
      }
      throw new HTTPException(400, { message: "Invalid JSON" });
    }

    if (event.type === ApplicationWebhookType.Ping) {
      c.status(204);
      return c.body(null);
    }

    if (event.type !== ApplicationWebhookType.Event) {
      console.warn(`Unknown event type: ${event.type}`);
      Sentry.addBreadcrumb({
        category: "discord.webhook",
        message: "Unknown webhook type",
        level: "warning",
        data: { type: event.type },
      });
      throw new HTTPException(400, { message: "Unknown event type" });
    }

    if (!event.event?.type || !event.event?.data || !event.event.data.id) {
      throw new HTTPException(400, { message: "Invalid event structure" });
    }

    const drizzle = drizzleD1(c.env.D1);

    const entityId = event.event.data.id;

    const allowedEventTypes = new Set([
      "ENTITLEMENT_CREATE",
      "ENTITLEMENT_UPDATE",
      "ENTITLEMENT_DELETE",
    ] as const);

    if (!allowedEventTypes.has(event.event.type)) {
      const eventId = crypto.randomUUID();

      console.warn(`Unknown entitlement event type: ${event.event.type}`);
      Sentry.addBreadcrumb({
        category: "discord.webhook",
        message: "Unknown entitlement event type",
        level: "warning",
        data: {
          type: event.event.type,
          entityId,
          applicationId: event.application_id,
        },
      });

      await recordSubscriptionEvent(
        {
          id: eventId,
          entityId,
          eventType: event.event.type,
          eventData: event.event.data,
          processed: false,
        },
        drizzle
      );

      throw new HTTPException(400, { message: "Unknown entitlement event" });
    }

    try {
      await ingestEntitlementEvent(
        {
          type: event.event.type,
          timestamp: event.event.timestamp,
          data: event.event.data,
        },
        drizzle
      );
    } catch (error) {
      if (!(error instanceof HTTPException)) {
        Sentry.captureException(error);
      }

      throw error;
    }

    return c.text("OK");
  } catch (error) {
    if (error instanceof HTTPException) throw error;

    console.error("Error processing Discord entitlement webhook:", error);
    Sentry.captureException(error);
    throw new HTTPException(500, { message: "Internal Server Error" });
  }
}
