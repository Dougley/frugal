import { ColumnType, GeneratedAlways } from "kysely";

export interface Giveaway {
  message_id: string;
  guild_id: string;
  channel_id: string;
  end_time: string;
  prize: string;
  winners: number;
  entry_count: GeneratedAlways<number>;
  host_id: string;
  description: ColumnType<string, string | undefined, string | undefined>;
  durable_object_id: string;
}
