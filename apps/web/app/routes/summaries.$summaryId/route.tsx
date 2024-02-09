/// <reference types="@dougley/types/summaries" />

import type { LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { add } from "date-fns/add";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { LuBomb, LuChevronLeft, LuSave } from "react-icons/lu";
import ParticipantsTable from "~/components/ParticipantsTable";
import Stats from "~/components/SummaryStats";
import WinnersTable from "~/components/WinnersTable";
import { defaultMeta } from "~/utils/meta";

// Loaders provide data to components and are only ever called on the server, so
// you can connect to a database or run any server side code you want right next
// to the component that renders it.
// https://remix.run/api/conventions#loader
export let loader: LoaderFunction = async ({ params, context, request }) => {
  const bucket = context.STORAGE as R2Bucket;
  const url = new URL(request.url);
  const cacheKey = new Request(url.toString(), request);
  const id = params.summaryId;
  // @ts-expect-error - not typed?
  const cache = caches.default as Cache;

  // check if the request is already in the cache
  const cached = await cache.match(cacheKey);
  if (cached) {
    console.log(
      `Cache hit for ${id} with etag ${cached.headers.get(
        "etag",
      )}, and url ${url.toString()}`,
    );
    return cached;
  }

  const obj = await bucket.head(`giveaway-${id}.json`);
  if (obj === null) {
    console.log(
      `Cache miss for ${id} with url ${url.toString()}, but not found in bucket.`,
    );
    throw json({ ok: false, error: "not found" }, { status: 404 });
  }

  const data = await bucket.get(`giveaway-${id}.json`);
  console.log(
    `Cache miss for ${id} with url ${url.toString()}, but found in bucket.`,
  );

  const headers = new Headers();
  data!.writeHttpMetadata(headers);
  headers.set("etag", data!.etag);
  // cache for 3 months, which is the default expiry for everything
  headers.set("cache-control", "public, max-age=7776000");

  // https://remix.run/api/remix#json
  const resp = json(await data!.json(), {
    headers,
  });
  await cache.put(cacheKey, resp.clone());
  return resp;
};

export const meta: MetaFunction = () => {
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
        Giveaway Summary
      </h1>
      <div className="text m-5 text-center">Prize: {data.details.prize}</div>
      <div className="flex justify-center">
        <Stats details={data.details} entries={data.entries} />
      </div>
      <h3 className="m-5 text-center text-2xl font-semibold">
        Original Winners
      </h3>
      <div className="overflow-x-auto">
        <WinnersTable
          winners={data.details.originalWinners}
          participants={data.entries}
        />
      </div>
      <div className="divider"></div>
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
        <button className="btn btn-disabled btn-error gap-2">
          <LuBomb className="h-6 w-6" />
          Delete
        </button>
      </div>
      <div className="flex justify-center p-2.5">
        <p className="text-sm">
          Summary expires{" "}
          {formatDistanceToNow(
            add(new Date(data.details.time.end), { days: 90 }),
            {
              addSuffix: true,
            },
          )}
        </p>
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
