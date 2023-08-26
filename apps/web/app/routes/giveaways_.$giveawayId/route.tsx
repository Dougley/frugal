/// <reference types="@dougley/types/summaries" />

import type { Database } from "@dougley/d1-database";
import type { LoaderFunction, V2_MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { PermissionFlags, PermissionsBitField } from "discord-bitflag";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { LuChevronLeft, LuGem, LuSave } from "react-icons/lu";
import type { Authenticator } from "remix-auth";
import ParticipantsTable from "~/components/ParticipantsTable";
import Stats from "~/components/SummaryStats";
import type { DiscordUser } from "~/services/authenticator.server";
import { defaultMeta } from "~/utils/meta";

// Loaders provide data to components and are only ever called on the server, so
// you can connect to a database or run any server side code you want right next
// to the component that renders it.
// https://remix.run/api/conventions#loader
export let loader: LoaderFunction = async ({
  params,
  context,
  request,
}): Promise<SummaryOutput> => {
  let { giveawayId } = params;
  if (giveawayId === undefined) {
    throw json({ ok: false, error: "not found" }, { status: 404 });
  }
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: context.D1 as D1Database }),
  });
  const user = (await (context.authenticator as Authenticator).isAuthenticated(
    request,
    {
      failureRedirect: "/login",
    },
  )) as DiscordUser;
  const managableGuilds = user.guilds.filter((g) =>
    new PermissionsBitField(Number(g.permissions)).has(
      PermissionFlags.ManageGuild,
    ),
  );
  const isPremium = await db
    .selectFrom("premium_subscriptions")
    .where("discord_user_id", "=", user.id)
    .select(["discord_user_id", "active"])
    .executeTakeFirst();
  if (!isPremium || !isPremium.active) {
    throw json({ ok: false, error: "not premium" }, { status: 402 });
  }
  const giveaway = await db
    .selectFrom("giveaways")
    .where("message_id", "=", giveawayId)
    .selectAll()
    .executeTakeFirst();
  if (!giveaway) {
    throw json({ ok: false, error: "not found" }, { status: 404 });
  }
  if (!managableGuilds.some((g) => g.id === giveaway.guild_id)) {
    throw json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const entries = await db
    .selectFrom("entries")
    .where("giveaway_id", "=", giveawayId)
    .selectAll()
    .execute();

  const DISCORD_EPOCH = 1420070400000;
  const startDate = new Date(
    Number(BigInt(giveaway.message_id) >> 22n) + DISCORD_EPOCH,
  );
  return {
    _version: 2,
    details: {
      prize: giveaway.prize,
      message: giveaway.message_id,
      originalWinners: [],
      winners: giveaway.winners,
      channel: giveaway.channel_id,
      time: {
        start: startDate.toISOString(),
        end: giveaway.end_time,
      },
    },
    entries: entries.map((entry) => ({
      id: entry.user_id,
      username: entry.username,
      discriminator: entry.discriminator,
      avatar: entry.avatar,
      timestamp: entry.timestamp,
    })),
  };
};

export const meta: V2_MetaFunction = () => {
  return defaultMeta("Summaries");
};

// https://remix.run/guides/routing#index-routes
export default function Index() {
  let data = useLoaderData() as SummaryOutput;

  return (
    <div className="flex min-h-screen w-full flex-col justify-center overflow-x-auto">
      <Link to="/giveaways" className="mx-auto">
        <button className="btn">
          <LuChevronLeft className="h-6 w-6" />
          Back to Giveaways
        </button>
      </Link>
      <h1 className="m-5 text-center text-4xl font-semibold">
        Giveaway Halftime Summary
      </h1>
      <div className="alert mx-auto max-w-fit">
        <LuGem className="h-6 w-6 text-secondary" />
        This is a premium feature! Aren't you special?
      </div>
      <div className="text m-5 text-center">Prize: {data.details.prize}</div>
      <div className="flex justify-center">
        <Stats details={data.details} entries={data.entries} />
      </div>
      <div className="overflow-x-auto">
        <ParticipantsTable participants={data.entries} />
      </div>
      <div className="divider"></div>
      <div className="btn-row flex justify-center space-x-4">
        <div
          className="tooltip"
          data-tip="Download the raw JSON file for this giveaway"
        >
          <button className="btn gap-2" onClick={() => downloadFile(data)}>
            <LuSave className="h-6 w-6" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

function downloadFile(data: SummaryOutput) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.setAttribute("download", `${data.details.message}.json`);
  a.setAttribute("target", "_blank");
  a.click();
}
