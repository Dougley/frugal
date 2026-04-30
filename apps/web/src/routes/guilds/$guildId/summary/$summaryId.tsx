import {
  createFileRoute,
  type ErrorComponentProps,
  useRouter,
} from "@tanstack/react-router";

import { ErrorDisplay } from "~/components/ErrorDisplay";
import {
  SUMMARY_NOT_FOUND_CONFIG,
  SummaryView,
} from "~/components/SummaryView/SummaryView";
import { noIndexMeta } from "~/utils/seo";

const PARTICIPANTS_PER_PAGE = 25;

export const Route = createFileRoute("/guilds/$guildId/summary/$summaryId")({
  loader: async ({ context, params }) => {
    if (context.session) {
      await context.queryClient.ensureQueryData(
        context.trpc.giveaways.getSummary.queryOptions({
          summaryId: params.summaryId,
          page: 1,
          limit: PARTICIPANTS_PER_PAGE,
        })
      );
    }
  },
  head: () => ({
    meta: [{ title: "Giveaway Summary | GiveawayBot" }, ...noIndexMeta],
  }),
  component: GuildSummaryRoute,
  errorComponent: GuildSummaryError,
});

function GuildSummaryError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <ErrorDisplay
      error={error}
      onRetry={() => router.invalidate()}
      notFoundConfig={SUMMARY_NOT_FOUND_CONFIG}
    />
  );
}

function GuildSummaryRoute() {
  const { summaryId, guildId } = Route.useParams();
  return <SummaryView summaryId={summaryId} backTo={`/guilds/${guildId}/`} />;
}
