import { Kysely } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import { Database } from "./models/database";

const config = {
  host: PLANETSCALE_HOST, // Filled by esbuild, see scripts/build.js
  username: PLANETSCALE_USERNAME,
  password: PLANETSCALE_PASSWORD,
};

const db = new Kysely<Database>({
  dialect: new PlanetScaleDialect(config),
});

export default db;
