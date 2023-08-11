import type { Database } from "@dougley/d1-database";
import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { Authenticator } from "remix-auth";
import GiveawayTable from "~/components/GiveawayTable";
import type { DiscordUser } from "~/services/authenticator.server";
import { defaultMeta } from "~/utils/meta";

export const meta: V2_MetaFunction = () => {
  return defaultMeta();
};

export const loader = async ({ context, request }: LoaderArgs) => {
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: context.D1 as D1Database }),
  });
  const user = (await (context.authenticator as Authenticator).isAuthenticated(
    request,
    {
      failureRedirect: "/login",
    },
  )) as DiscordUser;
  return {
    user,
    hosted: await db
      .selectFrom("giveaways")
      .where("host_id", "=", user.id)
      .select([
        "durable_object_id",
        "message_id",
        "end_time",
        "prize",
        "winners",
        "guild_id",
      ])
      .orderBy("end_time", "desc")
      .execute(),
    entered: await db
      .selectFrom("entries")
      .where("user_id", "=", user.id)
      .innerJoin("giveaways", "giveaways.message_id", "entries.giveaway_id")
      .select([
        "giveaways.durable_object_id",
        "giveaways.message_id",
        "giveaways.end_time",
        "giveaways.prize",
        "giveaways.winners",
        "giveaways.guild_id",
      ])
      .orderBy("giveaways.end_time", "desc")
      .execute(),
  };
};

export default function Index() {
  const { hosted, entered } = useLoaderData<{
    hosted: {
      durable_object_id: string;
      message_id: string;
      end_time: Date;
      prize: string;
      winners: number;
      guild_id: string;
    }[];
    entered: {
      durable_object_id: string;
      message_id: string;
      end_time: Date;
      prize: string;
      winners: number;
      guild_id: string;
    }[];
  }>();
  return (
    <div className="flex min-h-screen flex-col justify-center overflow-x-auto">
      <div className="mt-5 flex min-w-full flex-col justify-center overflow-x-auto lg:flex-row">
        <div className="mx-auto flex w-full min-w-fit sm:flex-col">
          <GiveawayTable data={hosted} title="Hosted Giveaways" />
        </div>
        <div className="divider lg:divider-horizontal" />
        <div className="mx-auto flex w-full min-w-fit sm:flex-col">
          <GiveawayTable data={entered} title="Entered Giveaways" />
        </div>
      </div>
    </div>
  );
}
