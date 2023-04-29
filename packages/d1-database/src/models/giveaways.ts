export interface Giveaway {
  message_id: string;
  guild_id: string;
  channel_id: string;
  end_time: Date;
  prize: string;
  winners: number;
  entry_count: number;
  durable_object_id: string;
}
