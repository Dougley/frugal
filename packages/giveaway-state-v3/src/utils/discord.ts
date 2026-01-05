import { REST } from "@discordjs/rest";

const USER_AGENT =
  "DiscordBot (@giveawaybot/timer, v1; +https://github.com/dougley/frugal)";

/**
 * Creates a configured Discord REST client for API requests
 * @param token - Discord bot token
 * @returns Configured REST client
 *
 * @example
 * ```ts
 * const rest = createDiscordRest(ctx.env.DISCORD_BOT_TOKEN);
 * await rest.patch(Routes.channelMessage(channelId, messageId), { body: { content: "Updated!" } });
 * ```
 */
export function createDiscordRest(token: string): REST {
  return new REST({
    version: "10",
    userAgentAppendix: USER_AGENT,
    // Use native fetch for edge environment compatibility
    // biome-ignore lint/suspicious/noExplicitAny: Cloudflare Workers fetch has different types than Node's fetch
    makeRequest: fetch as any,
  }).setToken(token);
}
