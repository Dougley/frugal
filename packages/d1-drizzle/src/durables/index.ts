import { drizzle } from "drizzle-orm/durable-sqlite";
import * as schema from "./schema";

const drizzleDurable = (storage: DurableObjectStorage) => {
  return drizzle(storage, { schema });
};

export * from "drizzle-orm";
export { migrate } from "drizzle-orm/durable-sqlite/migrator";
// biome-ignore lint/suspicious/noTsIgnore: migrations are dynamically generated
// @ts-ignore
export * as Migrations from "./drizzle/migrations";
export * as Schema from "./schema";
export { drizzleDurable };
