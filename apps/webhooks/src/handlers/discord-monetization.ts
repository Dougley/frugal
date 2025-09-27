import { drizzleD1, eq, lt, Schema } from "@dougley/frugal-drizzle/workers";
import type { APIEntitlement } from "discord-api-types/v10";
import { ApplicationWebhookType, EntitlementType } from "discord-api-types/v10";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { verifyDiscordSignature } from "../utils/discord-verify";

// Just shorthand for the Discord API types
export type DiscordEntitlement = APIEntitlement;

// Define our own webhook event structure since we only handle entitlement events
// DAPI types dont seem to cover the full webhook event structure??
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

/**
 * Check if this is a test purchase (no real money involved)
 * Doesn't consider subscriptions SKUs, only one-time purchases
 * @param entitlement - The entitlement to check
 * @returns true if it's a test mode purchase
 */
export function isTestEntitlement(entitlement: DiscordEntitlement): boolean {
  return entitlement.type === EntitlementType.TestModePurchase;
}

/**
 * Check if this is a recurring subscription (monthly/yearly billing)
 * @param entitlement - The entitlement to check
 * @returns true if it's a subscription-based entitlement
 */
export function isSubscriptionEntitlement(
  entitlement: DiscordEntitlement
): boolean {
  return (
    entitlement.type === EntitlementType.ApplicationSubscription ||
    entitlement.type === EntitlementType.PremiumSubscription // not that we actually CAN sell nitro, but lol
  );
}

/**
 * Check if this can be "consumed" or used up (like game coins or credits)
 * @param entitlement - The entitlement to check
 * @returns true if it has a consumed property (meaning it can be used up)
 */
export function isConsumableEntitlement(
  entitlement: DiscordEntitlement
): boolean {
  return entitlement.consumed !== undefined;
}

/**
 * Check if this is a durable/permanent purchase (buy once, keep forever)
 * @param entitlement - The entitlement to check
 * @returns true if it's not a subscription and can't be consumed
 */
export function isDurableEntitlement(entitlement: DiscordEntitlement): boolean {
  return (
    !isSubscriptionEntitlement(entitlement) &&
    !isConsumableEntitlement(entitlement)
  );
}

/**
 * Main handler for Discord monetization webhooks
 * Verifies the signature and processes entitlement/subscription events
 * @param c - Hono context with environment bindings
 * @returns Response indicating success or failure
 */
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
      throw new HTTPException(401, { message: "Invalid signature" });
    }

    let event: DiscordWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error("Failed to parse webhook body:", error);
      throw new HTTPException(400, { message: "Invalid JSON" });
    }

    // Discord pings us to make sure we're alive
    if (event.type === ApplicationWebhookType.Ping) {
      c.status(204);
      return c.body(null);
    } else if (event.type !== ApplicationWebhookType.Event) {
      console.warn(`Unknown event type: ${event.type}`);
      throw new HTTPException(400, { message: "Unknown event type" });
    }

    if (!event.event?.type || !event.event?.data || !event.event.data.id) {
      throw new HTTPException(400, { message: "Invalid event structure" });
    }

    const drizzle = drizzleD1(c.env.D1);

    await processWebhookEvent(event.event, drizzle);

    return c.text("OK");
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error processing Discord entitlement webhook:", error);
    throw new HTTPException(500, { message: "Internal Server Error" });
  }
}

/**
 * Clean up old subscription events to keep the database from getting huge
 * @param database - The D1 database instance
 * @param retentionDays - How many days to keep events (default: 30)
 * @returns Promise with cleanup result
 */
export async function cleanupOldEvents(
  database: D1Database,
  retentionDays: number = 30
) {
  const drizzle = drizzleD1(database);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffTimestamp = cutoffDate.toISOString();

  try {
    await drizzle
      .delete(Schema.subscriptionEvents)
      .where(lt(Schema.subscriptionEvents.createdAt, cutoffTimestamp));

    console.log(
      `Cleaned up subscription events older than ${retentionDays} days (before ${cutoffTimestamp})`
    );
    return { success: true, cutoffDate: cutoffTimestamp };
  } catch (error) {
    console.error("Failed to cleanup old subscription events:", error);
    throw error;
  }
}

async function processWebhookEvent(
  event: DiscordWebhookEventData,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<void> {
  const entityId = event.data.id;
  const eventId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    // Figure out what kind of event this is and handle it
    const entitlement = event.data;
    switch (event.type) {
      case "ENTITLEMENT_CREATE":
        await handleEntitlementCreate(entitlement, drizzle);
        break;
      case "ENTITLEMENT_UPDATE":
        await handleEntitlementUpdate(entitlement, drizzle);
        break;
      case "ENTITLEMENT_DELETE":
        await handleEntitlementDelete(entitlement, drizzle);
        break;
      default:
        console.warn(`Unknown entitlement event type: ${event.type}`);
        return;
    }

    // Record that we handled this successfully
    await drizzle.insert(Schema.subscriptionEvents).values({
      id: eventId,
      entityId,
      eventType: event.type,
      eventData: event.data,
      processed: true,
      processedAt: timestamp,
    });
  } catch (error) {
    // Record that something went wrong for debugging
    await drizzle.insert(Schema.subscriptionEvents).values({
      id: eventId,
      entityId,
      eventType: event.type,
      eventData: event.data,
      processed: false,
    });

    console.error(
      `Failed to process ${event.type} for entity ${entityId}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle when someone buys something new
 * @param entitlement - The new entitlement data from Discord
 * @param drizzle - Database connection
 */
async function handleEntitlementCreate(
  entitlement: DiscordEntitlement,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<void> {
  // Figure out what type of purchase this is
  const isTest = isTestEntitlement(entitlement);

  await drizzle
    .insert(Schema.entitlements)
    .values({
      id: entitlement.id,
      applicationId: entitlement.application_id,
      skuId: entitlement.sku_id,
      userId: entitlement.user_id || null,
      guildId: entitlement.guild_id || null,
      type: entitlement.type,
      deleted: entitlement.deleted,
      startsAt: entitlement.starts_at || "",
      endsAt: entitlement.ends_at || null,
      consumed: entitlement.consumed || null,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: Schema.entitlements.id,
      set: {
        deleted: entitlement.deleted,
        endsAt: entitlement.ends_at || null,
        consumed: entitlement.consumed || null,
        updatedAt: new Date().toISOString(),
      },
    });

  console.log(
    `Created entitlement ${entitlement.id} for ${entitlement.guild_id ? "guild" : "user"} ${entitlement.guild_id || entitlement.user_id}${isTest ? " [TEST MODE]" : ""}`
  );
}

/**
 * Handle when an entitlement changes (like getting consumed or deleted)
 * @param entitlement - The updated entitlement data from Discord
 * @param drizzle - Database connection
 */
async function handleEntitlementUpdate(
  entitlement: DiscordEntitlement,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<void> {
  // See what actually changed since last time
  const previousEntitlement = await drizzle
    .select()
    .from(Schema.entitlements)
    .where(eq(Schema.entitlements.id, entitlement.id))
    .limit(1);

  const wasConsumed = previousEntitlement[0]?.consumed;
  const isNowConsumed = entitlement.consumed;
  const consumptionChanged = wasConsumed !== isNowConsumed;

  await drizzle
    .update(Schema.entitlements)
    .set({
      deleted: entitlement.deleted,
      endsAt: entitlement.ends_at || null,
      consumed: entitlement.consumed || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(Schema.entitlements.id, entitlement.id));

  const isTest = isTestEntitlement(entitlement);

  const changes = [];
  if (entitlement.deleted) changes.push("deleted");
  if (entitlement.ends_at) changes.push(`ended at ${entitlement.ends_at}`);
  if (consumptionChanged) {
    changes.push(`consumed: ${wasConsumed} → ${isNowConsumed}`);
  }

  console.log(
    `Updated entitlement ${entitlement.id}${changes.length > 0 ? `: ${changes.join(", ")}` : ""}${isTest ? " [TEST MODE]" : ""}`
  );
}

/**
 * Handle when an entitlement gets deleted (refunds, chargebacks, etc.)
 * Deletions are rare! Most changes are updates.
 * @param entitlement - The deleted entitlement data from Discord
 * @param drizzle - Database connection
 */
async function handleEntitlementDelete(
  entitlement: DiscordEntitlement,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<void> {
  await drizzle
    .update(Schema.entitlements)
    .set({
      deleted: true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(Schema.entitlements.id, entitlement.id));

  console.log(
    `Deleted entitlement ${entitlement.id} for ${entitlement.guild_id ? "guild" : "user"} ${entitlement.guild_id || entitlement.user_id}`
  );
}
