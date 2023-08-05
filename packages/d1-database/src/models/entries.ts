import { ColumnType, Generated } from "kysely";

export interface Entry {
  user_id: string;
  giveaway_id: string;
  winner: ColumnType<number, number | null, number | null>;
  timestamp: Generated<string>;
  avatar: string | null;
  username: string;
  discriminator: string | null;
}
