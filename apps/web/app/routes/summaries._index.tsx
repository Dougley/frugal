/// <reference types="@dougley/types/summaries" />

import type { ActionArgs } from "@remix-run/cloudflare";
import { type V2_MetaFunction } from "@remix-run/cloudflare";
import { Form, useActionData } from "@remix-run/react";
import { MdError, MdOutlineFileUpload } from "react-icons/md";
import { z } from "zod";
import ParticipantsTable from "~/components/ParticipantsTable";
import Stats from "~/components/SummaryStats";
import WinnersTable from "~/components/WinnersTable";
import { defaultMeta } from "~/utils/meta";

export const meta: V2_MetaFunction = () => {
  return defaultMeta("Summaries");
};

const summaryScheme: z.ZodType<SummaryOutput> = z.object({
  _version: z.literal(2),
  details: z.object({
    channel: z.string(),
    message: z.string(),
    prize: z.string(),
    winners: z.number(),
    originalWinners: z.array(z.string()),
    time: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
  }),
  entries: z.array(
    z.object({
      id: z.string(),
      username: z.string(),
      discriminator: z.string(),
      avatar: z.nullable(z.string()),
    })
  ),
});

export async function action({ request }: ActionArgs) {
  try {
    const body = await request.formData();
    const file = body.get("file") as File;
    const text = await file.text();
    const data = summaryScheme.parse(JSON.parse(text));
    return { ok: true, data };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        ok: false,
        // map path to a string
        error: e.issues
          .map((i) => `"${i.path.join(".")}" - ${i.message}`)
          .join("\n"),
      };
    }
    if (e instanceof SyntaxError) {
      return { ok: false, error: "invalid JSON" };
    }
    return { ok: false, error: "invalid file" };
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
        <button type="submit" className="btn-primary btn gap-2">
          <MdOutlineFileUpload className="h-6 w-6" />
          Render
        </button>
      </Form>
    </div>
  );
}

export default function Index() {
  const data = useActionData() as
    | { ok: false; error: string }
    | { ok: true; data: SummaryOutput }
    | undefined;
  if (!data) {
    return (
      <div className="hero flex min-h-screen w-full flex-col justify-center overflow-x-auto">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Giveaway Summaries</h1>
            <p className="py-6">
              Summaries are small files that contain the results of a giveaway.
              They can be used to verify that a giveaway was fair and to see who
              won. Summaries can be rendered using the "Summary" button shown on
              every completed giveaway.
            </p>
            <p className="py-6">
              If you have a backup file you'd like to render instead, you can
              upload it here.
            </p>
            <Upload />
          </div>
        </div>
      </div>
    );
  } else {
    if (!data.ok) {
      return (
        <div className="hero flex min-h-screen w-full flex-col justify-center overflow-x-auto">
          <h1 className="m-5 text-center text-4xl font-semibold">
            Render Error
          </h1>
          <div className="alert alert-error w-auto shadow-lg">
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
        </div>
      );
    }
    return (
      <div className="flex min-h-screen w-full flex-col justify-center overflow-x-auto">
        <h1 className="m-5 text-center text-4xl font-semibold">
          Giveaway Summary
        </h1>
        <div className="text m-5 text-center">
          Prize: {data.data.details.prize}
        </div>
        <div className="flex justify-center">
          <Stats details={data.data.details} entries={data.data.entries} />
        </div>
        <h3 className="m-5 text-center text-2xl font-semibold">Winners</h3>
        <div className="overflow-x-auto">
          <WinnersTable
            winners={data.data.details.originalWinners}
            participants={data.data.entries}
          />
        </div>
        <div className="divider"></div>
        <h3 className="mb-5 text-center text-2xl font-semibold">
          Participants
        </h3>
        <div className="overflow-x-auto">
          <ParticipantsTable participants={data.data.entries} />
        </div>
        <div className="divider"></div>
        <Upload />
      </div>
    );
  }
}
