import type { LoaderFunction, V2_MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import add from "date-fns/add";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import type { APIUser, Snowflake } from "discord-api-types/v9";
import { HiOutlineSave, HiTrash } from "react-icons/hi";
import ParticipantsTable from "~/components/ParticipantsTable";
import Stats from "~/components/SummaryStats";
import WinnersTable from "~/components/WinnersTable";
import { defaultMeta } from "~/utils/meta";

type ResultsFile = {
  details: {
    channel: Snowflake;
    message: Snowflake;
    prize: string;
    winners: `${number}`;
    time: number;
    duration: number;
    originalWinners: Snowflake[];
  };
  entrants: APIUser[];
};

// Loaders provide data to components and are only ever called on the server, so
// you can connect to a database or run any server side code you want right next
// to the component that renders it.
// https://remix.run/api/conventions#loader
export let loader: LoaderFunction = async ({ params, context, request }) => {
  const bucket = context.R2 as R2Bucket;
  const id = params.summaryId;
  const cache = await caches.open("custom:cache");
  const cached = await cache.match(request);
  if (cached) {
    console.log("cache hit");
    return cached;
  }

  const obj = await bucket.head(`timer:${id}.json`);
  if (obj === null) {
    throw json({ ok: false, error: "not found" }, { status: 404 });
  }

  const data = (await (await bucket.get(
    `timer:${id}.json`
  ))!.json()) as ResultsFile;
  console.log("cache miss");

  // https://remix.run/api/remix#json
  const resp = json(data, {
    headers: {
      // cache for a year
      "cache-control": "public, max-age=31536000",
    },
  });

  await cache.put(request, resp);
  return resp;
};

export const meta: V2_MetaFunction = () => {
  return defaultMeta("Summaries");
};

// https://remix.run/guides/routing#index-routes
export default function Index() {
  let data = useLoaderData();

  return (
    <div className="flex min-h-screen w-full flex-col justify-center overflow-x-auto">
      <h1 className="m-5 text-center text-4xl font-semibold">
        Giveaway Summary
      </h1>
      <div className="text m-5 text-center">Prize: {data.details.prize}</div>
      <div className="flex justify-center">
        <Stats details={data.details} entrants={data.entrants} />
      </div>
      <h3 className="m-5 text-center text-2xl font-semibold">
        Original Winners
      </h3>
      <div className="overflow-x-auto">
        <WinnersTable
          winners={data.details.originalWinners}
          participants={data.entrants}
        />
      </div>
      <div className="divider"></div>
      <h3 className="mb-5 text-center text-2xl font-semibold">Participants</h3>
      <div className="overflow-x-auto">
        <ParticipantsTable participants={data.entrants} />
      </div>
      <div className="divider"></div>
      <div className="btn-row flex justify-center space-x-4">
        <div
          className="tooltip"
          data-tip="Download the raw JSON file for this giveaway"
        >
          <button className="btn gap-2" onClick={() => downloadFile(data)}>
            <HiOutlineSave className="h-6 w-6" />
            Download
          </button>
        </div>
        <button className="btn-disabled btn-error btn gap-2">
          <HiTrash className="h-6 w-6" />
          Delete
        </button>
      </div>
      <div className="flex justify-center p-2.5">
        <p className="text-sm">
          Summary expires{" "}
          {formatDistanceToNow(add(data.details.time, { days: 90 }), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
}

function downloadFile(data: ResultsFile) {
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
