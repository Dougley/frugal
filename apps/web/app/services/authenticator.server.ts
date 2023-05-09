import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/rest/v9/user";
import type { DiscordProfile } from "~/services/DiscordStrategy.server";

export interface DiscordUser {
  id: DiscordProfile["id"];
  username: DiscordProfile["displayName"];
  discriminator: DiscordProfile["_json"]["discriminator"];
  avatar: DiscordProfile["photos"][0]["value"];
  email: DiscordProfile["_json"]["email"];
  guilds: RESTAPIPartialCurrentUserGuild[];
}
