import { APIUser } from "discord-api-types/v9";
import { DOProxy } from "do-proxy";
import db from "planetscale-discord";
import { Button, createElement, Message } from "slshx";
import { GiveawayEmbed } from "./commands/components/giveawayEmbed";
import { createMessage, editMessage } from "./utils/discord";
import { getToucan } from "./utils/sentry";

export class Timer extends DOProxy {
  state: DurableObjectState;
  storage: DurableObjectStorage;
  env: Env;
  constructor(state: DurableObjectState, env: Env) {
    super(state);
    // the constructor is called once the object receives its first request
    this.state = state;
    this.storage = state.storage;
    this.env = env;
  }

  async start() {
    console.log("start");
    const message = await this.storage.get<string>("message");
    const time = await this.storage.get<number>("time");
    if (message === undefined || time === undefined) {
      throw new Error("this object has not been setup");
    }
    await this.storage.setAlarm(time);
    await this.env.KV.put(`timer:${message}`, this.state.id.toString());
    await this.storage.delete(`needsSetup`);
  }

  async entry(user: APIUser) {
    const alarm = await this.storage.getAlarm();
    if (alarm === null) {
      throw new Error("this object has expired");
    }
    console.log("entry", user.id);
    if ((await this.storage.get(`entry:${user.id}`)) !== undefined) {
      await this.storage.delete(`entry:${user.id}`);
      return false;
    } else {
      await this.storage.put(`entry:${user.id}`, user);
      return true;
    }
  }

  async getEntry(id: string) {
    const alarm = await this.storage.getAlarm();
    if (alarm === null) {
      throw new Error("this object has expired");
    }
    return (await this.storage.get(`entry:${id}`)) !== undefined;
  }

  async entrants() {
    const entrants = Array.from(
      (await this.storage.list({ prefix: "entry:" })).keys()
    ).map((entrant) => (entrant as string).substring(6));
    return entrants;
  }

  async fullEntrants() {
    const entrants = Array.from(await this.storage.list({ prefix: "entry:" }));
    return entrants.map(([, user]) => {
      return {
        ...(user as APIUser),
      };
    });
  }

  async status() {
    const alarm = await this.storage.getAlarm();
    return !!alarm;
  }

  async reroll() {
    const entrants = Array.from(
      (await this.storage.list({ prefix: "entry:" })).keys()
    ) as string[];
    console.log("reroll", entrants);
    if (entrants.length === 0) {
      throw new Error("no entrants");
    }
    const entrant =
      entrants[Math.floor(Math.random() * entrants.length)].substring(6);
    return entrant;
  }

  async details() {
    const alarm = await this.storage.getAlarm();
    return {
      channel: await this.storage.get<string>("channel"),
      message: await this.storage.get<string>("message"),
      prize: await this.storage.get<string>("prize"),
      winners: await this.storage.get<string>("winners"),
      time: await this.storage.get<number>("time"),
      duration: await this.storage.get<string>("duration"),
      alarm,
    };
  }

  async editAlarm(time: number) {
    await this.storage.deleteAlarm();
    await this.storage.setAlarm(time);
  }

  async setup({
    channel,
    time,
    message,
    winners,
    prize,
    duration,
    guild,
  }: {
    channel?: string;
    time?: number;
    message?: string;
    winners?: string;
    prize?: string;
    duration?: string;
    guild?: string;
  }) {
    await this.edit({
      channel,
      time,
      message,
      winners,
      prize,
      duration,
      guild,
    });
    await this.storage.put("needsSetup", "1");
    await this.storage.setAlarm(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
  }

  async edit({
    channel,
    time,
    message,
    winners,
    prize,
    duration,
    guild,
  }: {
    channel?: string;
    time?: number;
    message?: string;
    winners?: string;
    prize?: string;
    duration?: string;
    guild?: string;
  }) {
    if (channel) await this.storage.put("channel", channel);
    if (time) await this.storage.put("time", time);
    if (message) await this.storage.put("message", message);
    if (winners) await this.storage.put("winners", winners);
    if (prize) await this.storage.put("prize", prize);
    if (duration) await this.storage.put("duration", duration);
    if (guild) await this.storage.put("guild", guild);
  }

  async purge() {
    await this.storage.deleteAll();
  }

  async alarm() {
    // in this context, this is the first time we're calling toucan
    const toucan = getToucan(this.state, undefined, this.env);
    const tx = toucan.startTransaction({
      op: "alarm",
      name: "Alarm",
    });
    tx.setTag("object", this.state.id.toString());
    toucan.configureScope((scope) => {
      scope.setSpan(tx);
    });
    try {
      console.log("alarm");
      const needsSetup = await this.storage.get("needsSetup");
      if (needsSetup) {
        console.log("discarding stale object still in setup");
        await this.storage.deleteAll();
      } else {
        const entrants = await this.fullEntrants();
        const channel = await this.storage.get<string>("channel");
        const howMany = Number(await this.storage.get("winners"));
        const winners = Array.from(
          { length: howMany },
          () => entrants[Math.floor(Math.random() * entrants.length)].id
        ).filter((x) => x !== undefined) as string[];
        const winnersSet = new Set(winners);
        if (entrants.length === 0) {
          await createMessage(channel!, {
            content: "nobody won :(",
            message_reference: {
              message_id: (await this.storage.get("message")) as string,
              channel_id: channel,
              guild_id: await this.storage.get("guild"),
            },
          });
        } else {
          await createMessage(channel!, {
            content: `Congrats ${Array.from(winnersSet)
              .map((x) => `<@${x}>`)
              .join(", ")}! You won **${await this.storage.get("prize")}**!`,
            allowed_mentions: {
              users: Array.from(winnersSet),
            },
            message_reference: {
              message_id: (await this.storage.get("message")) as string,
              channel_id: channel,
              guild_id: await this.storage.get("guild"),
            },
          });
        }
        const details = await this.details();
        const fileData = JSON.stringify({
          details: {
            ...details,
            time: Date.now(),
            originalWinners: Array.from(winnersSet),
          },
          entrants,
        });
        console.log(fileData);
        await this.env.STORAGE.put(
          `timer:${this.state.id.toString()}.json`,
          fileData,
          {
            httpMetadata: {
              contentType: "application/json",
            },
          }
        );
        await db
          .deleteFrom("giveaways")
          .where("durable_object_id", "=", this.state.id.toString())
          .execute();
        const message = (
          <Message>
            <GiveawayEmbed
              ended
              // @ts-ignore
              details={{
                ...details,
                time: Date.now(),
                winners:
                  winnersSet.size > 0
                    ? Array.from(winnersSet)
                        .map((x) => `<@${x}>`)
                        .join(", ")
                    : "Nobody!",
              }}
            />
            <Button
              url={`${SUMMARY_SITE}/summaries/${this.state.id.toString()}`}
            >
              Summary
            </Button>
          </Message>
        );
        await editMessage(
          channel!,
          (await this.storage.get("message")) as string,
          message
        );
      }
      tx.status = "ok";
      tx.finish();
    } catch (e) {
      const tx = toucan.getScope()?.getTransaction();
      if (tx) {
        tx.status = "internal_error";
        tx.finish();
      }
      toucan.captureException(e);
      console.error(e);
    }
  }
}
