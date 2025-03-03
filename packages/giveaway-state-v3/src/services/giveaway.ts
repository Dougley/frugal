import { PrismaClient, PrismaD1 } from "@dougley/d1-prisma";
import { TRPCError } from "@trpc/server";
import type { Context } from "../trpc";

export type GiveawayEntry = {
  user_id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
};

export class GiveawayService {
  private readonly prisma: PrismaClient;
  private readonly id: string;
  private static instances = new Map<string, GiveawayService>();

  private constructor(context: Context<Env>) {
    const adapter = new PrismaD1(context.env.D1);
    this.prisma = new PrismaClient({ adapter });
    this.id = context.state.id.toString();
  }

  static getInstance(context: Context<Env>): GiveawayService {
    const id = context.state.id.toString();
    if (!this.instances.has(id)) {
      this.instances.set(id, new GiveawayService(context));
    }
    return this.instances.get(id)!;
  }

  async getGiveaway() {
    const giveaway = await this.prisma.giveaways.findUnique({
      where: { durable_object_id: this.id },
    });

    if (!giveaway) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Giveaway not found",
      });
    }

    return giveaway;
  }

  async getEntries() {
    const giveaway = await this.getGiveaway();
    return this.prisma.entries.findMany({
      where: { giveaway_id: giveaway.message_id },
    });
  }

  async startAlarm(date: Date | number) {
    if (typeof date === "number") {
      date = new Date(Date.now() + date);
    }

    await this.prisma.giveaways.update({
      where: {
        durable_object_id: this.id,
        state: "NEW",
      },
      data: { state: "OPEN" },
    });
    return { success: true };
  }

  async drawWinners() {
    const giveaway = await this.getGiveaway();
    const { message_id, winners } = giveaway;

    const entrants = await this.prisma.$queryRaw<GiveawayEntry[]>`
      SELECT *
      FROM entries
      WHERE ROWID IN (
        SELECT ROWID
        FROM entries
        WHERE giveaway_id = ${message_id}
        AND winner = false
        ORDER BY RANDOM()
        LIMIT ${winners}
      )
      ORDER BY RANDOM();
    `;

    const winnerIds = entrants.map(({ user_id }) => user_id);
    await this.prisma.entries.updateMany({
      where: {
        giveaway_id: message_id,
        user_id: { in: winnerIds },
      },
      data: { winner: true },
    });

    return {
      success: true,
      winners: entrants.map(({ user_id, username, discriminator, avatar }) => ({
        id: user_id,
        username,
        discriminator,
        avatar,
      })),
    };
  }

  async beginGiveaway(data: {
    message_id: string;
    channel_id: string;
    guild_id: string;
    prize: string;
    winners: number;
    end_time: Date;
    host_id: string;
  }) {
    const giveaway = await this.prisma.giveaways.create({
      data: {
        durable_object_id: this.id,
        ...data,
        state: "NEW",
      },
    });

    return {
      success: true,
      giveaway: {
        ...giveaway,
        end_time: giveaway.end_time.toISOString(),
      },
    };
  }

  async addEntry(entry: GiveawayEntry) {
    const giveaway = await this.getGiveaway();

    if (giveaway.state !== "OPEN") {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Giveaway is not open for entries",
      });
    }

    const existingEntry = await this.prisma.entries.findFirst({
      where: {
        giveaway_id: giveaway.message_id,
        user_id: entry.user_id,
      },
    });

    if (existingEntry) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User has already entered this giveaway",
      });
    }

    const created = await this.prisma.entries.create({
      data: {
        giveaway_id: giveaway.message_id,
        ...entry,
        winner: false,
      },
    });

    return { success: true, entry: created };
  }

  async removeEntry(userId: string) {
    const giveaway = await this.getGiveaway();

    if (giveaway.state !== "OPEN") {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Giveaway is not open for entries",
      });
    }

    const entry = await this.prisma.entries.delete({
      where: {
        user_id_giveaway_id: {
          giveaway_id: giveaway.message_id,
          user_id: userId,
        },
      },
    });

    return { success: true, entry };
  }

  async endGiveaway() {
    const giveaway = await this.getGiveaway();

    if (giveaway.state === "CLOSED") {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Giveaway is already closed",
      });
    }

    await this.prisma.giveaways.update({
      where: { durable_object_id: this.id },
      data: { state: "CLOSED" },
    });

    return { success: true };
  }

  static async getActiveGiveaways(context: Context<Env>, guildId: string) {
    const adapter = new PrismaD1(context.env.D1);
    const prisma = new PrismaClient({ adapter });
    return prisma.giveaways.findMany({
      where: {
        guild_id: guildId,
        state: "OPEN",
      },
      orderBy: { end_time: "asc" },
    });
  }

  async flushToStorage(storage: R2Bucket, winners: GiveawayEntry[]) {
    const giveaway = await this.getGiveaway();

    if (giveaway.state !== "CLOSED") {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Giveaway must be closed to flush",
      });
    }

    const entrants = await this.getEntries();
    const summary: SummaryOutput = {
      _version: 2,
      entries: entrants.map(({ user_id, username, discriminator, avatar }) => ({
        id: user_id,
        username,
        discriminator,
        avatar,
      })),
      details: {
        channel: giveaway.channel_id,
        message: giveaway.message_id,
        winners: giveaway.winners,
        prize: giveaway.prize,
        originalWinners: winners.map((w) => w.user_id),
        time: {
          end: giveaway.end_time.toISOString(),
          start: giveaway.end_time.toISOString(),
        },
      },
    };

    const key = `giveaway-${this.id}.json`;
    await storage.put(key, JSON.stringify(summary), {
      httpMetadata: {
        contentType: "application/json",
        cacheExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 3),
        cacheControl: "public, max-age=7776000",
      },
    });

    return { success: true, object: key };
  }

  async cleanup() {
    const giveaway = await this.getGiveaway();

    await this.prisma.entries.deleteMany({
      where: { giveaway_id: giveaway.message_id },
    });

    await this.prisma.giveaways.delete({
      where: { durable_object_id: this.id },
    });

    return { success: true };
  }
}
