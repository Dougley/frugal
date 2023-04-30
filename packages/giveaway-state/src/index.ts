/// <reference types="@dougley/types/summaries" />

import {
  APIMessage,
  ButtonStyle,
  ComponentType,
  RESTPatchAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessageJSONBody,
} from "discord-api-types/v9";
import { DOProxy } from "do-proxy";

export class GiveawayState extends DOProxy {
  state: DurableObjectState;
  storage: DurableObjectStorage;
  env: Env;

  boundChannel: string | undefined; // Channel ID
  boundGuild: string | undefined; // Guild ID
  boundMessage: string | undefined; // Message ID

  startDate: Date | undefined; // Date of the giveaway start
  endDate: Date | undefined; // Date of the giveaway end
  winnerAmount: number | undefined; // Amount of winners
  prize: string | undefined; // Prize of the giveaway

  constructor(state: DurableObjectState, env: Env) {
    super(state);
    // the constructor is called once the object receives its first request
    this.state = state;
    this.storage = state.storage;
    this.env = env;

    // we cannot initialize properties here, because the object may be
    // deserialized from storage at any time, and we don't want to overwrite
    // the values that were stored.
  }

  get running() {
    // there's a little leaway here so the alarm doesnt clear before the giveaway
    return this.endDate && this.endDate.getTime() + 1000 > Date.now();
  }

  /**
   * Setup the object to get ready for a giveaway
   * @param channel Channel ID
   * @param guild Guild ID
   * @param message Message ID
   * @param winners Amount of winners
   * @param prize Prize of the giveaway
   */
  setup({
    channel,
    guild,
    message,
    winners,
    prize,
  }: {
    channel?: string;
    guild?: string;
    message?: string;
    winners?: number;
    prize?: string;
  }) {
    this.boundChannel = channel;
    this.boundGuild = guild;
    this.boundMessage = message;
    this.winnerAmount = winners;
    this.prize = prize;
  }

  /**
   * Set an alarm for the giveaway end
   * @param date Date of the giveaway end
   * @throws Error if the date is in the past
   */
  async setAlarm(time: string) {
    // primitives only, remember we're dealing with something thats basically
    // a service worker that responds to fetch requests
    const date = new Date(time);
    if (date.getTime() < Date.now()) {
      throw new Error("Date is in the past");
    }
    await this.storage.setAlarm(date.getTime());
    if (!this.startDate) this.startDate = new Date();
    this.endDate = date;
  }

  /**
   * Add an entry to the giveaway
   * @param user User to add
   * @throws Error if the user is already entered
   * @throws Error if the giveaway is not running
   */
  async addEntry(user: SavedUserInformation) {
    if (!this.running) {
      throw new Error("Giveaway is not running");
    }
    await this.storage.put(`entry:${user.id}`, JSON.stringify(user));
  }

  /**
   * Deletes an entry in the database
   * @param user {object} The user to delete
   * @param user.id {string} The user's ID
   */
  async removeEntry(user: Pick<SavedUserInformation, "id">) {
    await this.storage.delete(`entry:${user.id}`);
  }

  /**
   * Get someone's entry
   * @param user - The user to retrieve the entry for.
   */
  async getEntry(user: Pick<SavedUserInformation, "id">) {
    const entry = await this.storage.get(`entry:${user.id}`);
    return entry;
  }

  /**
   * Remove all entries from the giveaway
   */
  async purgeEntries() {
    return await this.storage.deleteAll();
  }

  /**
   * Get all entries from the giveaway
   * @returns Array of entries
   */
  async getEntries() {
    const entries = await this.storage.list({ prefix: "entry:" });
    const users: SavedUserInformation[] = [];
    for await (const [, user] of entries) {
      users.push(JSON.parse(user as string));
    }
    return users;
  }

  /**
   * Flush a summary of the giveaway to the R2 bucket
   * @param winners - The winners of the giveaway
   */
  async flushR2(winners: SavedUserInformation[]) {
    const entries = await this.getEntries();
    // construct a summary of the giveaway
    const summary: SummaryOutput = {
      _version: 2,
      details: {
        channel: this.boundChannel!,
        message: this.boundMessage!,
        prize: this.prize!,
        winners: this.winnerAmount!,
        originalWinners: winners.map((w) => w.id),
        time: {
          start: this.startDate!.toISOString(),
          end: this.endDate!.toISOString(),
        },
      },
      entries,
    };
    // now flush the data to the R2 bucket
    const bucket = this.env.STORAGE;
    const key = `giveaway-${this.state.id.toString()}.json`;
    const response = await bucket.put(key, JSON.stringify(summary), {
      httpMetadata: {
        contentType: "application/json",
        // objects expire in 3 months
        cacheExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 3),
        cacheControl: "public, max-age=7776000",
      },
    });
  }

  /**
   * Construct a message from the winners
   * @returns Formatted message
   */
  getFormattedEntries(winners: SavedUserInformation[]) {
    const formatter = new Intl.ListFormat("en", {
      style: "long",
      type: "conjunction",
    });
    const winnersString = formatter.format(winners.map((w) => `<@${w.id}>`));
    const message =
      winners.length > 0
        ? `Congratulations ${winnersString}! You won **${this.prize}**!`
        : "Nobody entered the giveaway, so nobody won.";
    return message;
  }

  /**
   * Draw winners from the giveaway
   * @param amount Amount of winners to draw
   * @param skip Array of users to skip
   * @returns Array of winners
   */
  async drawWinners(
    amount: number = 1,
    skip: string[] = []
  ): Promise<SavedUserInformation[]> {
    const entries = await this.getEntries();
    if (entries.length === 0) {
      return [];
    }

    if (entries.length < amount) {
      // If there are less entries than winners, just return all entries
      return entries;
    }

    // winners is a set to prevent duplicates
    const winners = new Set<SavedUserInformation>();
    while (winners.size < amount) {
      const winner = entries[Math.floor(Math.random() * entries.length)];
      if (!skip.includes(winner.id)) winners.add(winner);
    }

    // Return an array of winners, because it's easier to work with
    return Array.from(winners);
  }

  /**
   * @private
   */
  async alarm() {
    console.log("Alarm triggered");
    // This method is called when the alarm is triggered
    // We can use it to send a message to the channel
    // and then delete the object

    if (!this.running) {
      // if the giveaway is not running, we can just delete the object
      // since it's probably a cleanup alarm
      console.log(
        `Cleaning up object ${this.state.id} for message ${this.boundMessage}`
      );
      await this.purgeEntries();
    } else {
      // before we do anything, check if the message is still there
      // we treat deleting the original message as a cancel
      const giveawayMessage = await fetch(
        `https://discord.com/api/v9/channels/${this.boundChannel}/messages/${this.boundMessage}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bot ${this.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );
      if (giveawayMessage.ok) {
        const msg = (await giveawayMessage.json()) as APIMessage;
        const winners = await this.drawWinners(this.winnerAmount);
        const message = this.getFormattedEntries(winners);
        // announce the winners with a new message
        await fetch(
          `https://discord.com/api/v9/channels/${this.boundChannel}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bot ${this.env.DISCORD_BOT_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: message,
              message_reference: {
                message_id: this.boundMessage,
                channel_id: this.boundChannel,
                guild_id: this.boundGuild,
              },
              allowed_mentions: {
                users: winners.map((x) => x.id),
              },
            } as RESTPostAPIChannelMessageJSONBody),
          }
        );
        // edit the original message to say that the giveaway is over
        const resp = await fetch(
          `https://discord.com/api/v9/channels/${this.boundChannel}/messages/${this.boundMessage}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bot ${this.env.DISCORD_BOT_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: "Giveaway ended!",
              embeds: [
                {
                  ...msg.embeds[0],
                  description: msg.embeds[0]
                    .description! //
                    .replace("Ends: ", "Ended: ")
                    .replace(
                      /Winners: \d+/,
                      `Winners: ${
                        winners.length > 0
                          ? winners.map((w) => `<@${w.id}>`).join(", ")
                          : "Nobody!"
                      }`
                    ),
                  color: 0x808080,
                },
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
          }
        );
        if (!resp.ok) {
          console.error(
            `Failed to edit message ${this.boundMessage} in channel ${this.boundChannel}`,
            await resp.text()
          );
        }
        // flush the results to R2 for summaries
        await this.flushR2(winners);
      }
      // we still need to clean up
      // wake up the object again after 3 months
      await this.storage.setAlarm(Date.now() + 1_000 * 60 * 60 * 24 * 90);
    }
  }
}
