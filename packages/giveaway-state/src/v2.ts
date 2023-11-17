/// <reference types="@dougley/types/summaries" />

import { DiscordAPIError } from "@discordjs/rest";
import type { Database } from "@dougley/d1-database";
import { HyperDurable } from "@ticketbridge/hyper-durable";
import {
  ButtonStyle,
  ComponentType,
  RESTGetAPIChannelMessageResult,
  RESTJSONErrorCodes,
  RESTPatchAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessageJSONBody,
  RouteBases,
  Routes,
} from "discord-api-types/v9";
import { Kysely, sql } from "kysely";
import { D1Dialect } from "kysely-d1";

export class GiveawayStateV2 extends HyperDurable<DurableObjectState, Env> {
  storage: DurableObjectStorage;
  env: Env;
  alarmTime: string;
  giveawayId: string;
  ended: boolean;

  constructor(state: DurableObjectState, env: Env) {
    // Pass state and env to HyperDurable
    super(state, env);
    this.storage = state.storage;
    this.env = env;
    // with hyperdurable, we can set initial state here
    // if there is previously persisted state, it will be loaded and override these values
    this.alarmTime = new Date(0).toISOString();
    this.giveawayId = "";
    this.ended = false;
  }
  // lets be honest, all this durable object does is run timers
  // so lets make it easy to start and stop them
  async startAlarm(time: string) {
    const date = new Date(time);
    if (date.getTime() < Date.now()) {
      throw new Error("Date is in the past");
    }
    await this.storage.setAlarm(date.getTime());
    this.alarmTime = date.toISOString();
  }

  async forceTrigger() {
    this.alarmTime = new Date().toISOString();
    await this.storage.setAlarm(1);
  }

  async flush(winners: SavedUserInformation[]) {
    const entries = await this.getEnties();
    const details = await this.getDetails();
    const summary: SummaryOutput = {
      _version: 2,
      entries: entries.map((e) => ({
        id: e.user_id,
        username: e.username,
        discriminator: e.discriminator,
        avatar: e.avatar,
      })),
      details: {
        channel: details.channel_id,
        message: details.message_id,
        winners: details.winners,
        prize: details.prize,
        originalWinners: winners.map((w) => w.id),
        time: {
          start: details.end_time,
          end: details.end_time,
        },
      },
    };
    // now flush the data to the R2 bucket
    const bucket = this.env.STORAGE;
    const key = `giveaway-${this.state.id.toString()}.json`;
    await bucket.put(key, JSON.stringify(summary), {
      httpMetadata: {
        contentType: "application/json",
        // objects expire in 3 months
        cacheExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 3),
        cacheControl: "public, max-age=7776000",
      },
    });
  }

  async getDetails() {
    const database = new Kysely<Database>({
      dialect: new D1Dialect({ database: this.env.D1 }),
    });
    return await database
      .selectFrom("giveaways")
      .selectAll()
      .where("message_id", "=", this.giveawayId)
      .executeTakeFirstOrThrow();
  }

  async getEnties() {
    const database = new Kysely<Database>({
      dialect: new D1Dialect({ database: this.env.D1 }),
    });
    return await database
      .selectFrom("entries")
      .selectAll()
      .where("giveaway_id", "=", this.giveawayId)
      .execute();
  }

  async drawWinners(size?: number) {
    const database = new Kysely<Database>({
      dialect: new D1Dialect({ database: this.env.D1 }),
    });
    const winnerCount = (await this.getDetails()).winners;
    const winners = await database
      .selectFrom("entries")
      .selectAll()
      .where((eb) =>
        eb(
          // we use ROWID here because its more performant than simply doing SORT BY RAND()
          // it also guarantees that we get unique rows, how cool is that?
          sql`ROWID`,
          "in",
          eb
            .selectFrom("entries")
            // @ts-expect-error - whatever
            .select(sql`ROWID`)
            .where((eb) =>
              eb.and([
                eb("giveaway_id", "=", this.giveawayId),
                eb("winner", "=", 0),
              ]),
            )
            .orderBy(sql`random()`)
            .limit(size ?? winnerCount),
        ),
      )
      .execute();
    if (winners.length > 0) {
      await database
        .updateTable("entries")
        .set({
          winner: 1,
        })
        .where((eb) =>
          eb.and([
            eb("giveaway_id", "=", this.giveawayId),
            eb(
              "user_id",
              "in",
              winners.map((w) => w.user_id),
            ),
          ]),
        )
        .execute();
    }
    return winners;
  }

  async purge() {
    const database = new Kysely<Database>({
      dialect: new D1Dialect({ database: this.env.D1 }),
    });
    await database
      .deleteFrom("entries")
      .where("giveaway_id", "=", this.giveawayId)
      .execute();
    await database
      .deleteFrom("giveaways")
      .where("message_id", "=", this.giveawayId)
      .execute();
  }

  private async alarm() {
    try {
      console.log("Alarm triggered");
      if (this.ended) {
        // this is a cleanup alarm
        console.log(
          `Cleaning up giveaway ${
            this.giveawayId
          } with ${this.state.id.toString()} as id, because it was already flushed`,
        );
        await this.purge();
        return;
      }
      // first, get the giveaway infomation from d1
      const giveaway = await this.getDetails();
      // check if our message is still there
      const resp = await fetch(
        RouteBases.api +
          Routes.channelMessage(giveaway.channel_id, giveaway.message_id),
        {
          method: "GET",
          headers: {
            Authorization: `Bot ${this.env.DISCORD_BOT_TOKEN}`,
          },
        },
      );
      if (!resp.ok) {
        const error = (await resp.json()) as DiscordAPIError;
        switch (error.code) {
          case RESTJSONErrorCodes.UnknownMessage:
          case RESTJSONErrorCodes.UnknownChannel:
            // the message or channel was deleted, we can stop here
            console.log(
              `Cleaning up giveaway ${
                this.giveawayId
              } with ${this.state.id.toString()} as id, because the message was deleted`,
            );
            await this.purge();
            break;
          default:
            // something else went wrong, we should probably stop here
            console.error(
              `Something went wrong while fetching the message: ${error.message}`,
            );
            // queue a new alarm in 5 minutes to retry
            this.storage.setAlarm(Date.now() + 1000 * 60 * 5);
            break;
        }
        return;
      }
      const message = (await resp.json()) as RESTGetAPIChannelMessageResult;
      // if the message is still there, we can draw winners
      const winners = await this.drawWinners();
      // if there are no winners, we can stop here
      if (winners.length === 0) {
        fetch(RouteBases.api + Routes.channelMessages(giveaway.channel_id), {
          method: "POST",
          headers: {
            Authorization: `Bot ${this.env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message_reference: {
              message_id: giveaway.message_id,
              channel_id: giveaway.channel_id,
            },
            content: "Nobody entered the giveaway, so nobody won.",
          } as RESTPostAPIChannelMessageJSONBody),
        });
      } else {
        // if there are winners, we can send a message
        const { prize } = giveaway;

        const winnersMention = winners.map((w) => `<@${w.user_id}>`);
        const winnersMentionList = new Intl.ListFormat("en", {
          style: "long",
          type: "conjunction",
        }).format(winnersMention);
        const content = `Congratulations ${winnersMentionList}! You won **${prize}**!`;

        console.log(
          JSON.stringify(
            await fetch(
              RouteBases.api + Routes.channelMessages(giveaway.channel_id),
              {
                method: "POST",
                headers: {
                  Authorization: `Bot ${this.env.DISCORD_BOT_TOKEN}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  content,
                  allowed_mentions: {
                    users: winners.map((w) => w.user_id),
                  },
                  message_reference: {
                    message_id: giveaway.message_id,
                    channel_id: giveaway.channel_id,
                  },
                } as RESTPostAPIChannelMessageJSONBody),
              },
            ).then((r) => r.json()),
          ),
        );
      }
      // edit the message to say it's over
      console.log(
        JSON.stringify(
          await fetch(
            RouteBases.api +
              Routes.channelMessage(giveaway.channel_id, giveaway.message_id),
            {
              method: "PATCH",
              headers: {
                Authorization: `Bot ${this.env.DISCORD_BOT_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                content: "Giveaway ended!",
                embeds: [
                  ...message.embeds.map((e) => {
                    let field = e.fields!.find((f) => f.name === "Ends")!;
                    let timestamp = (new Date().getTime() / 1000).toFixed(0);
                    field.name = "Ended";
                    field.value = `<t:${timestamp}:R> (<t:${timestamp}:F>)`;
                    e.description = `${
                      e.description ? e.description + "\n\n" : ""
                    } Winners: ${
                      winners.length > 0
                        ? winners.map((w) => `<@${w.user_id}>`).join(", ")
                        : "Nobody!"
                    }`;
                    e.color = 0x808080;
                    return e;
                  }),
                ],
                components: [
                  {
                    type: ComponentType.ActionRow,
                    components: [
                      {
                        type: ComponentType.Button,
                        style: ButtonStyle.Link,
                        url: `${
                          this.env.SUMMARY_URL
                        }/summaries/${this.state.id.toString()}`,
                        label: "View Summary",
                      },
                    ],
                  },
                ],
              } as RESTPatchAPIChannelMessageJSONBody),
            },
          ).then((r) => r.json()),
        ),
      );
      // all done! flush the results to D1 so we can render the summary
      await this.flush(
        winners.map((w) => {
          return {
            id: w.user_id,
            username: w.username,
            discriminator: w.discriminator,
            avatar: w.avatar,
          };
        }),
      );
    } catch (e) {
      console.error(`Alarm for ${this.giveawayId} failed`, e);
    } finally {
      this.ended = true;
      // set the alarm to run again in 3 months, so we can clean up
      await this.startAlarm(
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toUTCString(),
      );
    }
  }
}
