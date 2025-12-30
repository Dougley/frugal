/// <reference types="@dougley/types/summaries" />

import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Menu,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconDotsVertical,
  IconDownload,
  IconExternalLink,
  IconInfoCircle,
  IconPlayerPlay,
  IconX,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "~/components/AuthContext/AuthContext";
import { ErrorDisplay } from "~/components/ErrorDisplay";
import { RerollWinnersModal } from "~/components/GiveawayModals";
import { GiveawayStats } from "~/components/GiveawayStats";
import { NotLoggedIn } from "~/components/NotLoggedIn";
import ParticipantsTable from "~/components/ParticipantsTable/ParticipantsTable";
import WinnersTable from "~/components/WinnersTable/WinnersTable";
import { useLocalizedDayjs } from "~/lib/dayjs";
import { noIndexMeta } from "~/utils/seo";

const PARTICIPANTS_PER_PAGE = 25;

/**
 * Summary view route - fetches and displays a giveaway summary from R2
 *
 * Uses tRPC for data fetching with SSR prefetch for authenticated users.
 * First page of participants is SSR'd, subsequent pages fetched client-side.
 * Cached at the Cloudflare edge for performance.
 */
export const Route = createFileRoute("/giveaways/summaries/$summaryId")({
  loader: async ({ context, params }) => {
    // Only prefetch if authenticated - prefetch first page
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
  component: SummaryRoute,
  errorComponent: SummaryError,
});

/** Error display configuration for summary-related NOT_FOUND errors */
const SUMMARY_NOT_FOUND_CONFIG = {
  titleKey: "errors.summaryNotFound.title",
  messageKey: "errors.summaryNotFound.message",
} as const;

function SummaryError({ error }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <ErrorDisplay
      error={error}
      onRetry={() => router.invalidate()}
      notFoundConfig={SUMMARY_NOT_FOUND_CONFIG}
    />
  );
}

function SummarySkeleton() {
  const { t } = useTranslation();

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Button
            component={Link}
            to="/giveaways/overview"
            variant="subtle"
            leftSection={<IconArrowLeft size={16} aria-hidden="true" />}
            w="fit-content"
          >
            {t("giveaways.backToGiveaways")}
          </Button>
          <Skeleton height={36} width={120} />
        </Group>

        <Paper p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1 }}>
                <Skeleton height={32} width="60%" mb="xs" />
                <Skeleton height={20} width="40%" />
              </div>
              <Skeleton height={28} width={80} radius="xl" />
            </Group>

            <Divider />

            <Group gap="xl">
              <Skeleton height={24} width={100} />
              <Skeleton height={24} width={120} />
              <Skeleton height={24} width={140} />
            </Group>
          </Stack>
        </Paper>

        <Group gap="xl" align="flex-start" grow>
          <Skeleton height={300} />
          <Skeleton height={300} />
        </Group>
      </Stack>
    </Container>
  );
}

function SummaryRoute() {
  const { isAuthenticated } = useAuth();
  const { trpc, queryClient } = Route.useRouteContext();
  const { summaryId } = Route.useParams();
  const { t } = useTranslation();
  const dayjs = useLocalizedDayjs();
  const [participantsPage, setParticipantsPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  // Modal state
  const [rerollOpened, { open: openReroll, close: closeReroll }] =
    useDisclosure(false);

  // Use TanStack Query's useQuery with tRPC queryOptions
  // This fetches paginated data - first page is SSR'd
  const summaryQuery = useQuery({
    ...trpc.giveaways.getSummary.queryOptions({
      summaryId,
      page: participantsPage,
      limit: PARTICIPANTS_PER_PAGE,
    }),
    enabled: isAuthenticated,
    // Keep previous data while fetching next page for smooth UX
    placeholderData: (previousData) => previousData,
  });

  // Download handler - fetches complete summary via tRPC using queryClient
  const handleDownload = useCallback(async () => {
    if (!summaryQuery.data) return;

    setIsDownloading(true);
    try {
      // Use queryClient.fetchQuery with tRPC queryOptions for proper integration
      const result = await queryClient.fetchQuery(
        trpc.giveaways.downloadSummary.queryOptions({ summaryId })
      );

      const fullData = result.summary;
      if (!fullData) {
        notifications.show({
          title: t("notifications.downloadError.title"),
          message: t("notifications.downloadError.message"),
          icon: <IconX size={16} />,
          color: "red",
        });
        return;
      }

      const blob = new Blob([JSON.stringify(fullData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", `${fullData.details.message}.json`);
      a.setAttribute("target", "_blank");
      a.click();
      URL.revokeObjectURL(url);

      notifications.show({
        title: t("notifications.downloadSuccess.title"),
        message: t("notifications.downloadSuccess.message"),
        icon: <IconCheck size={16} />,
        color: "green",
        autoClose: 3000,
      });
    } catch (_error) {
      notifications.show({
        title: t("notifications.downloadError.title"),
        message: t("notifications.downloadError.message"),
        icon: <IconX size={16} />,
        color: "red",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [
    summaryQuery.data,
    summaryId,
    t,
    queryClient,
    trpc.giveaways.downloadSummary,
  ]);

  // Show not logged in if no session
  if (!isAuthenticated) {
    return <NotLoggedIn />;
  }

  // Show loading skeleton (only on initial load, not page changes)
  if (summaryQuery.isLoading && !summaryQuery.data) {
    return <SummarySkeleton />;
  }

  // Handle errors
  if (summaryQuery.error) {
    return (
      <ErrorDisplay
        error={summaryQuery.error}
        onRetry={() => summaryQuery.refetch()}
        notFoundConfig={SUMMARY_NOT_FOUND_CONFIG}
      />
    );
  }

  const data = summaryQuery.data;

  if (!data) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconInfoCircle aria-hidden="true" />}
          color="yellow"
          variant="light"
        >
          {t("summaries.summaryDataUnavailable")}
        </Alert>
      </Container>
    );
  }

  // Extract winners from current page entries
  const winners = data.entries.filter((entry) =>
    data.details.originalWinners.includes(entry.id)
  );

  const endTime = dayjs(data.details.time.end);
  const startTime = dayjs(data.details.time.start);
  const totalParticipants = data.pagination.total;
  const winnersCount = data.details.originalWinners.length;

  // Build Discord URL if we have the channel and message IDs
  const discordUrl = `https://discord.com/channels/-/${data.details.channel}/${data.details.message}`;

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Button
            component={Link}
            to="/giveaways/overview"
            variant="subtle"
            leftSection={<IconArrowLeft size={16} aria-hidden="true" />}
          >
            {t("giveaways.backToGiveaways")}
          </Button>

          <Group gap="sm">
            <Button
              component="a"
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              leftSection={<IconExternalLink size={16} aria-hidden="true" />}
            >
              {t("giveaways.openInDiscord")}
            </Button>
            <Button
              onClick={handleDownload}
              leftSection={<IconDownload size={16} aria-hidden="true" />}
              variant="filled"
              loading={isDownloading}
            >
              {t("common.download")}
            </Button>

            <Menu shadow="md" width={180} position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  size={36}
                  aria-label={t("giveaways.menu.actions")}
                >
                  <IconDotsVertical size={20} aria-hidden="true" />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{t("giveaways.menu.actions")}</Menu.Label>
                <Menu.Item
                  leftSection={<IconPlayerPlay size={16} aria-hidden="true" />}
                  onClick={openReroll}
                >
                  {t("giveaways.menu.reroll")}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconCopy size={16} aria-hidden="true" />}
                  onClick={() => {
                    navigator.clipboard.writeText(summaryId);
                    notifications.show({
                      title: t("notifications.copied.title"),
                      message: t("notifications.copied.message"),
                      icon: <IconCheck size={16} aria-hidden="true" />,
                      color: "green",
                      autoClose: 2000,
                    });
                  }}
                >
                  {t("giveaways.copyId")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        <Paper p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={2} mb="xs">
                  {data.details.prize}
                </Title>
                <Text c="dimmed" size="sm">
                  {t("summaries.expiresIn", {
                    time: endTime.add(90, "days").fromNow(),
                  })}
                </Text>
              </div>
              <Badge size="lg" variant="light" color="gray">
                {t("giveaways.status.closed")}
              </Badge>
            </Group>

            <Divider />

            <GiveawayStats
              winnersCount={winnersCount}
              participantsCount={totalParticipants}
              endTime={endTime}
              isEnded={true}
            />

            <Box>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">
                  {t("summaries.ranFrom", {
                    start: startTime.format("MMM D, YYYY"),
                    end: endTime.format("MMM D, YYYY"),
                  })}
                </Text>
              </Group>
            </Box>
          </Stack>
        </Paper>

        {/* Winners and Participants Tables */}
        <Group gap="xl" align="flex-start" grow>
          <Box>
            <WinnersTable winners={winners} />
          </Box>
          <Box>
            <ParticipantsTable
              participants={data.entries}
              pagination={{
                page: participantsPage,
                total: data.pagination.total,
                limit: PARTICIPANTS_PER_PAGE,
                hasMore: data.pagination.hasMore,
                isLoading: summaryQuery.isFetching,
              }}
              onPageChange={setParticipantsPage}
            />
          </Box>
        </Group>
      </Stack>

      {/* Action Modals */}
      <RerollWinnersModal
        opened={rerollOpened}
        onClose={closeReroll}
        giveaway={{
          durableObjectId: summaryId,
          prize: data.details.prize,
          winners: data.details.winners,
        }}
      />
    </Container>
  );
}
