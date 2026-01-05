import { drizzleD1, eq, lt, Schema } from "@dougley/frugal-drizzle/workers";
import { type APIEntitlement, EntitlementType } from "discord-api-types/v10";

export type DiscordEntitlement = APIEntitlement;

export type DiscordEntitlementEventType =
  | "ENTITLEMENT_CREATE"
  | "ENTITLEMENT_UPDATE"
  | "ENTITLEMENT_DELETE";

export interface DiscordEntitlementEvent {
  type: DiscordEntitlementEventType;
  timestamp: string;
  data: DiscordEntitlement;
}

export function isTestEntitlement(entitlement: DiscordEntitlement): boolean {
  return entitlement.type === EntitlementType.TestModePurchase;
}

export function isSubscriptionEntitlement(
  entitlement: DiscordEntitlement
): boolean {
  return (
    entitlement.type === EntitlementType.ApplicationSubscription ||
    entitlement.type === EntitlementType.PremiumSubscription
  );
}

export function isConsumableEntitlement(
  entitlement: DiscordEntitlement
): boolean {
  return typeof entitlement.consumed === "boolean";
}

export function isDurableEntitlement(entitlement: DiscordEntitlement): boolean {
  return (
    !isSubscriptionEntitlement(entitlement) &&
    !isConsumableEntitlement(entitlement)
  );
}

export async function upsertEntitlementFromDiscord(
  entitlement: DiscordEntitlement,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<void> {
  const now = new Date().toISOString();

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
      startsAt: entitlement.starts_at || now,
      endsAt: entitlement.ends_at ?? null,
      consumed: entitlement.consumed ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: Schema.entitlements.id,
      set: {
        deleted: entitlement.deleted,
        endsAt: entitlement.ends_at ?? null,
        consumed: entitlement.consumed ?? null,
        updatedAt: now,
      },
    });
}

export async function updateEntitlementFromDiscord(
  entitlement: DiscordEntitlement,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<void> {
  const now = new Date().toISOString();

  await drizzle
    .update(Schema.entitlements)
    .set({
      deleted: entitlement.deleted,
      endsAt: entitlement.ends_at ?? null,
      consumed: entitlement.consumed ?? null,
      updatedAt: now,
    })
    .where(eq(Schema.entitlements.id, entitlement.id));
}

export async function markEntitlementDeleted(
  entitlementId: string,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<void> {
  await drizzle
    .update(Schema.entitlements)
    .set({
      deleted: true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(Schema.entitlements.id, entitlementId));
}

export async function recordSubscriptionEvent(
  args: {
    id: string;
    entityId: string;
    eventType: string;
    eventData: unknown;
    processed: boolean;
    processedAt?: string;
  },
  drizzle: ReturnType<typeof drizzleD1>
): Promise<void> {
  await drizzle.insert(Schema.subscriptionEvents).values({
    id: args.id,
    entityId: args.entityId,
    eventType: args.eventType,
    eventData: args.eventData as unknown,
    processed: args.processed,
    processedAt: args.processedAt,
  });
}

export async function ingestEntitlementEvent(
  event: DiscordEntitlementEvent,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<void> {
  const entityId = event.data.id;
  const eventId = crypto.randomUUID();
  const processedAt = new Date().toISOString();

  try {
    switch (event.type) {
      case "ENTITLEMENT_CREATE":
        await upsertEntitlementFromDiscord(event.data, drizzle);
        break;
      case "ENTITLEMENT_UPDATE":
        await updateEntitlementFromDiscord(event.data, drizzle);
        break;
      case "ENTITLEMENT_DELETE":
        await markEntitlementDeleted(entityId, drizzle);
        break;
      default:
        return;
    }

    await recordSubscriptionEvent(
      {
        id: eventId,
        entityId,
        eventType: event.type,
        eventData: event.data,
        processed: true,
        processedAt,
      },
      drizzle
    );
  } catch (error) {
    await recordSubscriptionEvent(
      {
        id: eventId,
        entityId,
        eventType: event.type,
        eventData: event.data,
        processed: false,
      },
      drizzle
    );

    throw error;
  }
}

export async function cleanupOldSubscriptionEvents(
  database: D1Database,
  retentionDays: number = 30
) {
  const drizzle = drizzleD1(database);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffTimestamp = cutoffDate.toISOString();

  await drizzle
    .delete(Schema.subscriptionEvents)
    .where(lt(Schema.subscriptionEvents.createdAt, cutoffTimestamp));

  return { success: true, cutoffDate: cutoffTimestamp };
}
