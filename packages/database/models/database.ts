import { Giveaway } from "./giveaways";
import { Guild } from "./guilds";

export interface Database {
  giveaways: Giveaway;
  guilds: Guild;
}