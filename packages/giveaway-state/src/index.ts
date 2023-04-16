/// <reference types="discord-api-types/v9" />

import { DOProxy } from "do-proxy";

type SavedUserInformation = {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
};

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

  running: boolean = false; // Whether the giveaway is running

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
    this.running = true;
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

  async removeEntry(user: Pick<SavedUserInformation, "id">) {
    await this.storage.delete(`entry:${user.id}`);
  }

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
        : "No winners";
    return message;
  }

  /**
   * Draw winners from the giveaway
   * @param amount Amount of winners to draw
   * @param skip Array of users to skip
   * @returns Array of winners
   * @throws Error if there are no entries
   */
  async drawWinners(
    amount: number = 1,
    skip: string[] = []
  ): Promise<SavedUserInformation[]> {
    const entries = await this.getEntries();
    if (entries.length === 0) {
      throw new Error("There are no entries");
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

    // before we do anything, check if the message is still there
    // we treat deleting the original message as a cancel
    const giveawayMessage = await fetch(
      `https://discord.com/api/v9/channels/${this.boundChannel}/messages/${this.boundMessage}`,
      {
        // yes, we can use HEAD to check if the message is there, still takes ratelimit tokens though :(
        method: "HEAD",
        headers: {
          Authorization: `Bot ${this.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );
    if (giveawayMessage.ok) {
      const winners = await this.drawWinners();
      const message = this.getFormattedEntries(winners);
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
          }),
        }
      );
    }

    // we still need to clean up
    await this.storage.deleteAll();
  }
}
