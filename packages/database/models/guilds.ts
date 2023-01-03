import { ColumnType } from "kysely";

export interface Guild {
  id: string;
  premium: ColumnType<boolean, boolean | undefined, boolean| undefined>;
  emoji_id: string | null;
  emoji_name: string | null;
  embed_color: string | null;
}