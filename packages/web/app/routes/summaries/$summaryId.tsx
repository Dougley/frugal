import {
  type LoaderFunction,
  type MetaFunction,
  json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { formatDistance } from 'date-fns';
import ParticipantsTable from '~/components/ParticipantsTable';
import WinnersTable from '~/components/WinnersTable';

// Loaders provide data to components and are only ever called on the server, so
// you can connect to a database or run any server side code you want right next
// to the component that renders it.
// https://remix.run/api/conventions#loader
export let loader: LoaderFunction = async ({ params, context, request }) => {
  // todo: typing lol
  const bucket = context.R2 as R2Bucket;
  const id = params.summaryId;
  const cache = await caches.open('custom:cache');
  const cached = await cache.match(request);
  if (cached) {
    console.log('cache hit');
    return cached;
  }

  const obj = await bucket.head(`timer:${id}.json`);
  if (obj === null) {
    throw json({ ok: false, error: 'not found' }, { status: 404 });
  }

  const data = await (await bucket.get(`timer:${id}.json`))!.json();
  console.log('cache miss');

  // https://remix.run/api/remix#json
  const resp = json(data, {
    headers: {
      // cache for a year
      'cache-control': 'public, max-age=31536000',
    },
  });

  await cache.put(request, resp);
  return resp;
};

// https://remix.run/api/conventions#meta
export let meta: MetaFunction = () => {
  return {
    title: 'GiveawayBot',
    description: '',
  };
};

const formatter = new Intl.NumberFormat('en-US');

// https://remix.run/guides/routing#index-routes
export default function Index() {
  let data = useLoaderData();

  return (
    <div className="overflow-x-auto w-full min-h-screen flex flex-col justify-center">
      <main>
        <h1 className="text-4xl font-semibold text-center m-5">
          Giveaway Summary
        </h1>
        <div className="text text-center m-5">Prize: {data.details.prize}</div>
        <div className="flex justify-center">
          <div className="stats stats-vertical lg:stats-horizontal shadow justify-center">
            <div className="stat">
              <div className="stat-title">Participants</div>
              <div className="stat-value">
                {formatter.format(data.entrants.length)}
              </div>
            </div>

            <div className="stat">
              <div className="stat-title">Winners</div>
              <div className="stat-value">
                {formatter.format(data.details.winners)}
              </div>
            </div>

            <div className="stat">
              <div className="stat-title">Ended</div>
              <div className="stat-value">
                {formatDistance(new Date(data.details.time), new Date())} ago
              </div>
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-semibold text-center m-5">Winners</h3>
        <div className="overflow-x-auto">
          <WinnersTable
            winners={data.details.originalWinners}
            participants={data.entrants}
          />
        </div>
        <div className="divider"></div>
        <h3 className="text-2xl font-semibold text-center mb-5">
          Participants
        </h3>
        <div className="overflow-x-auto">
          <ParticipantsTable participants={data.entrants} />
        </div>
      </main>
    </div>
  );
}
