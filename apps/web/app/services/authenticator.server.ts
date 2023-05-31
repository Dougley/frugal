import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/rest/v9/user";
import type { DiscordProfile } from "~/services/DiscordStrategy.server";

export interface DiscordUser {
  id: DiscordProfile["id"];
  username: DiscordProfile["username"];
  displayName: DiscordProfile["displayName"];
  discriminator: DiscordProfile["discriminator"];
  avatar: DiscordProfile["photos"][0]["value"];
  email: DiscordProfile["_json"]["email"];
  guilds: RESTAPIPartialCurrentUserGuild[];
}
