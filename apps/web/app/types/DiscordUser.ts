import type {
  RESTAPIPartialCurrentUserGuild,
  RESTGetAPICurrentUserResult,
} from "discord-api-types/v9";

export interface DiscordUser {
  id: RESTGetAPICurrentUserResult["id"];
  username: RESTGetAPICurrentUserResult["username"];
  displayName: RESTGetAPICurrentUserResult["global_name"];
  avatar?: string;
  email?: string;
  guilds: RESTAPIPartialCurrentUserGuild[];
}
