import type { Database, Giveaway } from "@dougley/d1-database";
import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import formatDistance from "date-fns/formatDistance";
import isPast from "date-fns/isPast";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { Authenticator } from "remix-auth";
import type { DiscordUser } from "~/services/authenticator.server";
import { defaultMeta } from "~/utils/meta";

export const meta: V2_MetaFunction = () => {
  return defaultMeta();
};

export const loader = async ({ params, context, request }: LoaderArgs) => {
  const { guildId } = params;
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: context.D1 as D1Database }),
  });
  let user = await (
    context.authenticator as Authenticator<DiscordUser>
  ).isAuthenticated(request, {
    failureRedirect: "/login",
  });
  const guild = user.guilds.find((g) => g.id === guildId);
  if (!guild) {
    console.log("User not in guild", guildId);
    throw new Response("Unauthorized", { status: 401 });
  }
  if (
    (BigInt(guild.permissions) & BigInt(0x20)) !== BigInt(0x20) &&
    !guild.owner
  ) {
    console.log("User does not have perms");
    throw new Response("Unauthorized", { status: 401 });
  }
  const giveaways = await db
    .selectFrom("giveaways")
    .selectAll()
    .where("guild_id", "=", guildId!)
    // end date may not be 90 days in the past
    .where("end_time", ">=", new Date(Date.now() - 7776000000).toISOString())
    .orderBy("end_time", "desc")
    .execute();
  return { giveaways, user, guild };
};

export default function Index() {
  const { giveaways, guild } = useLoaderData() as {
    giveaways: Giveaway[];
    guild: DiscordUser["guilds"][0];
  };
  return (
    <div className="flex min-h-screen flex-col justify-center overflow-x-auto">
      <h1 className="m-5 text-center text-4xl font-semibold">
        Overview for {guild.name}
      </h1>
      <div className="flex flex-row flex-wrap justify-center">
        {giveaways.length === 0 && (
          <div className="card m-4 h-auto w-96 bg-base-300 p-4 shadow-xl">
            <div className="card-body items-center text-center">
              <p className="card-title">No giveaways</p>
              <p className="text-xs">There are no giveaways in this server.</p>
            </div>
          </div>
        )}
        {giveaways.map((g) => {
          const ended = isPast(new Date(g.end_time));
          const distance = formatDistance(new Date(g.end_time), new Date(), {
            addSuffix: true,
          });
          return (
            <Link
              to={ended ? `/summaries/${g.durable_object_id}` : "#"}
              key={g.durable_object_id}
              className={
                "btn-ghost card btn m-4 h-auto w-96 bg-base-300 p-4 normal-case shadow-xl" +
                (ended ? "" : " btn-disabled")
              }
            >
              <div className="card-body items-center text-center">
                <p className="card-title">{g.prize}</p>
                <p className="text-xs">
                  {g.winners} winner{g.winners > 1 ? "s" : ""}
                </p>
                <p className="text-xs">
                  {ended ? `Ended ${distance}` : `Ends ${distance}`}
                </p>
                {!ended && (
                  <p className="text-xs">
                    You can view the summary once the giveaway has ended.
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
