import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

const drizzleD1 = (storage: D1Database) => {
  return drizzle(storage, {
    schema,
  });
};

export * from "drizzle-orm";
export * as Schema from "./schema";
export { drizzleD1 };
