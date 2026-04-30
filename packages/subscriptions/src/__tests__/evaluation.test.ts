import { afterEach, describe, expect, test, vi } from "vitest";
import {
  compareEntitlementsForSelection,
  getPremiumStatus,
} from "../evaluation";
import type { PremiumCheckInput } from "../types";

type EntitlementStub = {
  id: string;
  skuId: string;
  type: number;
  endsAt: string | null;
};

function createDrizzleStub(entitlements: EntitlementStub[]) {
  return createDrizzleSequenceStub([entitlements]);
}

function createDrizzleSequenceStub(entitlementsByCall: EntitlementStub[][]) {
  let callCount = 0;

  return {
    getCallCount: () => callCount,
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => {
              const result =
                entitlementsByCall[
                  Math.min(callCount, entitlementsByCall.length - 1)
                ] ?? [];
              callCount += 1;
              return Promise.resolve(result.slice(0, 1));
            },
          }),
        }),
      }),
    }),
  };
}

describe("compareEntitlementsForSelection", () => {
  test("prefers lifetime over expiring", () => {
    const lifetime = {
      id: "a",
      endsAt: null,
      updatedAt: "2025-01-01T00:00:00.000Z",
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    const expiring = {
      id: "b",
      endsAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
      createdAt: "2025-01-02T00:00:00.000Z",
    };

    const sorted = [expiring, lifetime].sort(compareEntitlementsForSelection);
    expect(sorted[0]?.id).toBe("a");
  });

  test("prefers furthest endsAt for expiring", () => {
    const sooner = {
      id: "a",
      endsAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    const later = {
      id: "b",
      endsAt: "2027-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    const sorted = [sooner, later].sort(compareEntitlementsForSelection);
    expect(sorted[0]?.id).toBe("b");
  });

  test("uses updatedAt as tie-breaker", () => {
    const older = {
      id: "a",
      endsAt: null,
      updatedAt: "2025-01-01T00:00:00.000Z",
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    const newer = {
      id: "b",
      endsAt: null,
      updatedAt: "2025-02-01T00:00:00.000Z",
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    const sorted = [older, newer].sort(compareEntitlementsForSelection);
    expect(sorted[0]?.id).toBe("b");
  });
});

describe("getPremiumStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test("user-first: does not query guild when user has premium", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const drizzle = createDrizzleSequenceStub([
      [
        {
          id: "user-entitlement",
          skuId: "sku-user",
          type: 8,
          endsAt: null,
        },
      ],
      [
        {
          id: "guild-entitlement",
          skuId: "sku-guild",
          type: 8,
          endsAt: null,
        },
      ],
    ]);

    const input: PremiumCheckInput = { userId: "user-1", guildId: "guild-1" };
    const status = await getPremiumStatus(
      input,
      drizzle as unknown as Parameters<typeof getPremiumStatus>[1]
    );

    expect(status.source).toBe("user");
    expect(drizzle.getCallCount()).toBe(1);
  });

  test("falls back to guild when user has no premium", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const drizzle = createDrizzleSequenceStub([
      [],
      [
        {
          id: "guild-entitlement",
          skuId: "sku-guild",
          type: 8,
          endsAt: null,
        },
      ],
    ]);

    const input: PremiumCheckInput = { userId: "user-1", guildId: "guild-1" };
    const status = await getPremiumStatus(
      input,
      drizzle as unknown as Parameters<typeof getPremiumStatus>[1]
    );

    expect(status.source).toBe("guild");
    expect(status.entitlementId).toBe("guild-entitlement");
    expect(drizzle.getCallCount()).toBe(2);
  });

  test("test entitlement counts as premium", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const drizzle = createDrizzleStub([
      {
        id: "test-entitlement",
        skuId: "sku-test",
        type: 4,
        endsAt: null,
      },
    ]);

    const input: PremiumCheckInput = { userId: "user-1", guildId: null };
    const status = await getPremiumStatus(
      input,
      drizzle as unknown as Parameters<typeof getPremiumStatus>[1]
    );

    expect(status.hasPremium).toBe(true);
    expect(status.source).toBe("user");
    expect(status.isTest).toBe(true);
  });

  test("no active entitlement returns none source", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const drizzle = createDrizzleStub([]);

    const input: PremiumCheckInput = { userId: "user-1", guildId: null };
    const status = await getPremiumStatus(
      input,
      drizzle as unknown as Parameters<typeof getPremiumStatus>[1]
    );

    expect(status.hasPremium).toBe(false);
    expect(status.source).toBe("none");
    expect(status.entitlementId).toBe(null);
    expect(status.skuId).toBe(null);
  });
});
