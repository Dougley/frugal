export interface Giveaway {
  guild_id: string;
  message_id: string;
  channel_id: string;
  end_time: Date;
  winner_count: number;
  durable_object_id: string;
  prize: string;
}
