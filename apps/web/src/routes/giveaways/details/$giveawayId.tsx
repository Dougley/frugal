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
  Progress,
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
  IconClock,
  IconCopy,
  IconDotsVertical,
  IconEdit,
  IconExternalLink,
  IconInfoCircle,
  IconRefresh,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "~/components/AuthContext/AuthContext";
import { ErrorDisplay } from "~/components/ErrorDisplay";
import {
  EditGiveawayModal,
  StopGiveawayModal,
} from "~/components/GiveawayModals";
import { GiveawayStats } from "~/components/GiveawayStats";
import { NotLoggedIn } from "~/components/NotLoggedIn";
import ParticipantsTable from "~/components/ParticipantsTable/ParticipantsTable";
import { useLocalizedDayjs } from "~/lib/dayjs";
import { noIndexMeta } from "~/utils/seo";

const PARTICIPANTS_PER_PAGE = 25;

/**
 * Giveaway detail route - shows details for an active/in-progress giveaway
 *
 * Uses SSR prefetch for authenticated users. Shows live participant data
 * from Durable Object with auto-refresh.
 */
export const Route = createFileRoute("/giveaways/details/$giveawayId")({
  loader: async ({ context, params }) => {
    // Prefetch both details and first page of participants in parallel
    if (context.session) {
      await Promise.all([
        context.queryClient.ensureQueryData(
          context.trpc.giveaways.getDetails.queryOptions({
            giveawayId: params.giveawayId,
          })
        ),
        context.queryClient.ensureQueryData(
          context.trpc.giveaways.getParticipants.queryOptions({
            giveawayId: params.giveawayId,
            page: 1,
            limit: PARTICIPANTS_PER_PAGE,
          })
        ),
      ]);
    }
  },
  head: () => ({
    meta: [{ title: "Giveaway Details | GiveawayBot" }, ...noIndexMeta],
  }),
  component: GiveawayDetailRoute,
  errorComponent: GiveawayDetailError,
});

/** Error display configuration for giveaway-related NOT_FOUND errors */
const GIVEAWAY_NOT_FOUND_CONFIG = {
  titleKey: "errors.giveawayNotFound.title",
  messageKey: "errors.giveawayNotFound.message",
} as const;

function GiveawayDetailError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <ErrorDisplay
      error={error}
      onRetry={() => {
        reset();
        router.invalidate();
      }}
      notFoundConfig={GIVEAWAY_NOT_FOUND_CONFIG}
    />
  );
}

function DetailSkeleton() {
  const { t } = useTranslation();

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Button
          component={Link}
          to="/giveaways/overview"
          variant="subtle"
          leftSection={<IconArrowLeft size={16} aria-hidden="true" />}
          w="fit-content"
        >
          {t("giveaways.backToGiveaways")}
        </Button>

        <Paper radius="md" w="100%">
          <Skeleton height={32} width="60%" mb="md" />
          <Skeleton height={24} width="40%" mb="sm" />
          <Group gap="md" mb="md">
            <Skeleton height={28} width={100} radius="xl" />
            <Skeleton height={28} width={120} radius="xl" />
          </Group>
          <Skeleton height={8} width="100%" radius="xl" />
        </Paper>

        <Skeleton height={300} width="100%" />
      </Stack>
    </Container>
  );
}

function GiveawayDetailRoute() {
  const { isAuthenticated } = useAuth();
  const { trpc } = Route.useRouteContext();
  const { giveawayId } = Route.useParams();
  const { t } = useTranslation();
  const dayjs = useLocalizedDayjs();
  const [participantsPage, setParticipantsPage] = useState(1);

  // Modal state
  const [editOpened, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  const [stopOpened, { open: openStop, close: closeStop }] =
    useDisclosure(false);

  // Fetch giveaway details
  const detailsQuery = useQuery({
    ...trpc.giveaways.getDetails.queryOptions({ giveawayId }),
    enabled: isAuthenticated,
  });

  // Fetch participants (from Durable Object for active giveaways)
  const participantsQuery = useQuery({
    ...trpc.giveaways.getParticipants.queryOptions({
      giveawayId,
      page: participantsPage,
      limit: PARTICIPANTS_PER_PAGE,
    }),
    enabled: isAuthenticated && !!detailsQuery.data,
    // Refresh every 30 seconds for live data, but only when tab is visible
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    placeholderData: (previousData) => previousData,
  });

  if (!isAuthenticated) {
    return <NotLoggedIn />;
  }

  if (detailsQuery.isLoading) {
    return <DetailSkeleton />;
  }

  if (detailsQuery.error) {
    return (
      <ErrorDisplay
        error={detailsQuery.error}
        onRetry={() => detailsQuery.refetch()}
        notFoundConfig={GIVEAWAY_NOT_FOUND_CONFIG}
      />
    );
  }

  const { giveaway, guild } = detailsQuery.data ?? {};

  if (!giveaway || !guild) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconInfoCircle aria-hidden="true" />}
          color="yellow"
          variant="light"
        >
          {t("giveaways.giveawayDataUnavailable")}
        </Alert>
      </Container>
    );
  }

  const isClosed = giveaway.state === "CLOSED";
  const endTime = dayjs(giveaway.endTime);
  const now = dayjs();
  const isEnded = endTime.isBefore(now);

  // Calculate progress percentage for active giveaways
  // Assuming giveaways typically run for a period, we estimate based on remaining time
  const totalDuration = endTime.diff(
    dayjs(giveaway.endTime).subtract(7, "days"),
    "seconds"
  );
  const elapsed = now.diff(
    dayjs(giveaway.endTime).subtract(7, "days"),
    "seconds"
  );
  const progressPercent = Math.min(
    100,
    Math.max(0, (elapsed / totalDuration) * 100)
  );

  const discordUrl = `https://discord.com/channels/${guild.id}/${giveaway.channelId}/${giveaway.messageId}`;

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Button
            component={Link}
            to={`/giveaways/${guild.id}`}
            variant="subtle"
            leftSection={<IconArrowLeft size={16} aria-hidden="true" />}
          >
            {t("giveaways.backToGuild", { guildName: guild.name })}
          </Button>

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
                leftSection={<IconEdit size={16} aria-hidden="true" />}
                onClick={openEdit}
              >
                {t("giveaways.menu.edit")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconClock size={16} aria-hidden="true" />}
                color="red"
                onClick={openStop}
              >
                {t("giveaways.menu.stopEarly")}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconCopy size={16} aria-hidden="true" />}
                onClick={() => {
                  navigator.clipboard.writeText(giveaway.durableObjectId);
                  notifications.show({
                    title: t("notifications.copied.title"),
                    message: t("notifications.copied.message"),
                    icon: <IconCheck size={16} aria-hidden="true" />,
                    color: "lime",
                    autoClose: 2000,
                  });
                }}
              >
                {t("giveaways.copyId")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Paper p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={2} mb="xs">
                  {giveaway.prize}
                </Title>
                {giveaway.description && (
                  <Text c="dimmed" size="sm" mb="sm">
                    {giveaway.description}
                  </Text>
                )}
              </div>
              <Badge
                size="lg"
                variant="light"
                color={isClosed ? "gray" : isEnded ? "orange" : "pink"}
              >
                {isClosed
                  ? t("giveaways.status.closed")
                  : isEnded
                    ? t("giveaways.status.ending")
                    : t("giveaways.status.active")}
              </Badge>
            </Group>

            <Divider />

            <GiveawayStats
              winnersCount={giveaway.winners}
              participantsCount={participantsQuery.data?.total ?? 0}
              endTime={endTime}
              isEnded={isEnded}
              showLiveBadge={participantsQuery.data?.isLive}
            />

            {!isClosed && !isEnded && (
              <Box>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">
                    {t("giveaways.details.timeRemaining")}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {endTime.format("MMM D, YYYY [at] h:mm A")}
                  </Text>
                </Group>
                <Progress
                  value={progressPercent}
                  size="sm"
                  radius="xl"
                  color="pink"
                />
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Participants Section */}
        <Box>
          <Group justify="space-between" align="center" mb="md">
            <Title order={3}>{t("giveaways.details.participants")}</Title>
            {participantsQuery.data?.isLive && (
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconRefresh size={14} aria-hidden="true" />}
                onClick={() => participantsQuery.refetch()}
                loading={participantsQuery.isFetching}
              >
                {t("giveaways.details.refresh")}
              </Button>
            )}
          </Group>

          {participantsQuery.isLoading ? (
            <Skeleton height={200} />
          ) : participantsQuery.error ? (
            <Alert color="red" variant="light">
              {t("giveaways.details.failedToLoadParticipants")}
            </Alert>
          ) : participantsQuery.data ? (
            <ParticipantsTable
              participants={participantsQuery.data.participants.map((p) => ({
                id: p.userId,
                username: p.username,
                avatar: p.avatar ?? "",
                discriminator: "0",
              }))}
              pagination={{
                page: participantsPage,
                total: participantsQuery.data.total,
                limit: PARTICIPANTS_PER_PAGE,
                hasMore: participantsQuery.data.hasMore,
                isLoading: participantsQuery.isFetching,
              }}
              onPageChange={setParticipantsPage}
            />
          ) : null}

          {participantsQuery.data?.message && (
            <Alert color="indigo" variant="light" mt="md">
              {participantsQuery.data.message}
            </Alert>
          )}
        </Box>
      </Stack>

      {/* Action Modals */}
      <EditGiveawayModal
        opened={editOpened}
        onClose={closeEdit}
        giveaway={{
          durableObjectId: giveaway.durableObjectId,
          prize: giveaway.prize,
          winners: giveaway.winners,
          description: giveaway.description,
        }}
        guildId={guild.id}
      />
      <StopGiveawayModal
        opened={stopOpened}
        onClose={closeStop}
        giveaway={{
          durableObjectId: giveaway.durableObjectId,
          prize: giveaway.prize,
        }}
        guildId={guild.id}
      />
    </Container>
  );
}
