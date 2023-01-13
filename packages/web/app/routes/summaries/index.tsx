import type { ActionArgs } from '@remix-run/cloudflare';
import { type MetaFunction } from '@remix-run/cloudflare';
import { Form, useActionData } from '@remix-run/react';
import ParticipantsTable from '~/components/ParticipantsTable';
import Stats from '~/components/SummaryStats';
import WinnersTable from '~/components/WinnersTable';
import { z } from 'zod';
import { MdError, MdOutlineFileUpload } from 'react-icons/md';

// Loaders provide data to components and are only ever called on the server, so
// you can connect to a database or run any server side code you want right next
// to the component that renders it.
// https://remix.run/api/conventions#loader
// https://remix.run/api/conventions#meta
export let meta: MetaFunction = () => {
  return {
    title: 'GiveawayBot',
    description: '',
  };
};

const summaryScheme = z.object({
  _version: z.literal(1),
  details: z.object({
    channel: z.string(),
    message: z.string(),
    prize: z.string(),
    winners: z.number({ coerce: true }),
    time: z.number({ coerce: true }),
    duration: z.string(),
    originalWinners: z.array(z.string()),
  }),
  entrants: z.array(
    z.object({
      id: z.string(),
      username: z.string(),
      discriminator: z.string(),
      avatar: z.string(),
    })
  ),
});

export async function action({ request }: ActionArgs) {
  try {
    const body = await request.formData();
    const file = body.get('file') as File;
    const text = await file.text();
    const data = summaryScheme.parse(JSON.parse(text));
    return { ok: true, data };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        ok: false,
        // map path to a string
        error: e.issues
          .map((i) => `"${i.path.join('.')}" - ${i.message}`)
          .join('\n'),
      };
    }
    if (e instanceof SyntaxError) {
      return { ok: false, error: 'invalid JSON' };
    }
    return { ok: false, error: 'invalid file' };
  }
}

function Upload() {
  return (
    <div className="flex justify-center space-x-4">
      <Form method="post" encType="multipart/form-data" replace>
        <input
          type="file"
          name="file"
          className="file-input w-full max-w-xs"
          accept="application/json"
        />
        <button type="submit" className="btn gap-2 btn-primary">
          <MdOutlineFileUpload className="h-6 w-6" />
          Render
        </button>
      </Form>
    </div>
  );
}

// https://remix.run/guides/routing#index-routes
export default function Index() {
  const data = useActionData();
  if (!data) {
    return (
      <div className="overflow-x-auto hero w-full min-h-screen flex flex-col justify-center">
        <main>
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold">Giveaway Summaries</h1>
              <p className="py-6">
                Summaries are small files that contain the results of a
                giveaway. They can be used to verify that a giveaway was fair
                and to see who won. Summaries can be rendered using the
                "Summary" button shown on every completed giveaway.
              </p>
              <p className="py-6">
                If you have a backup file you'd like to render instead, you can
                upload it here.
              </p>
              <Upload />
            </div>
          </div>
        </main>
      </div>
    );
  } else {
    if (!data.ok) {
      return (
        <div className="overflow-x-auto hero w-full min-h-screen flex flex-col justify-center">
          <main>
            <h1 className="text-4xl font-semibold text-center m-5">
              Render Error
            </h1>
            <div className="alert alert-error shadow-lg">
              <pre className="language-js">
                <MdError size={24} />
                <code className="language-js">{data.error}</code>
              </pre>
            </div>
            <p className="py-6">
              If you got this file from someone, you should ask them to double
              check that they uploaded the correct file.
            </p>
            <Upload />
          </main>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto w-full min-h-screen flex flex-col justify-center">
        <main>
          <h1 className="text-4xl font-semibold text-center m-5">
            Giveaway Summary
          </h1>
          <div className="text text-center m-5">
            Prize: {data.data.details.prize}
          </div>
          <div className="flex justify-center">
            <Stats details={data.data.details} entrants={data.data.entrants} />
          </div>
          <h3 className="text-2xl font-semibold text-center m-5">Winners</h3>
          <div className="overflow-x-auto">
            <WinnersTable
              winners={data.data.details.originalWinners}
              participants={data.data.entrants}
            />
          </div>
          <div className="divider"></div>
          <h3 className="text-2xl font-semibold text-center mb-5">
            Participants
          </h3>
          <div className="overflow-x-auto">
            <ParticipantsTable participants={data.data.entrants} />
          </div>
          <div className="divider"></div>
          <Upload />
        </main>
      </div>
    );
  }
}
