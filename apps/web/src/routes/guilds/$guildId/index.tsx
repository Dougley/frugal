import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconExternalLink,
  IconFilter,
  IconGift,
  IconInfoCircle,
  IconSearch,
  IconSortAscending,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "~/components/AuthContext/AuthContext";
import { ErrorDisplay } from "~/components/ErrorDisplay";
import {
  GiveawayCard,
  GiveawayCardSkeleton,
  type GiveawayData,
} from "~/components/GiveawayCard";
import {
  EditGiveawayModal,
  RerollWinnersModal,
  StopGiveawayModal,
} from "~/components/GiveawayModals";
import { NotLoggedIn } from "~/components/NotLoggedIn";
import { noIndexMeta } from "~/utils/seo";

type FilterValue = "all" | "active" | "closed";
type SortValue = "endTime" | "prize";

export const Route = createFileRoute("/guilds/$guildId/")({
  loader: async ({ context, params }) => {
    if (context.session) {
      await context.queryClient.ensureQueryData(
        context.trpc.giveaways.getGuildGiveaways.queryOptions({
          guildId: params.guildId,
        })
      );
    }
  },
  head: () => ({
    meta: [{ title: "Guild Giveaways | GiveawayBot" }, ...noIndexMeta],
  }),
  component: GuildGiveawaysRoute,
});

const GUILD_NOT_FOUND_CONFIG = {
  titleKey: "errors.guildNotFound.title",
  messageKey: "errors.guildNotFound.message",
} as const;

function GiveawayListSkeleton() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          <GiveawayCardSkeleton />
          <GiveawayCardSkeleton />
          <GiveawayCardSkeleton />
          <GiveawayCardSkeleton />
          <GiveawayCardSkeleton />
          <GiveawayCardSkeleton />
        </SimpleGrid>
      </Stack>
    </Container>
  );
}

function GuildGiveawaysRoute() {
  const { isAuthenticated } = useAuth();
  const { trpc } = Route.useRouteContext();
  const { guildId } = Route.useParams();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sort, setSort] = useState<SortValue>("endTime");
  const [searchQuery, setSearchQuery] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [rerollModalOpen, setRerollModalOpen] = useState(false);
  const [selectedGiveaway, setSelectedGiveaway] = useState<GiveawayData | null>(
    null
  );

  const handleEdit = (giveaway: GiveawayData) => {
    setSelectedGiveaway(giveaway);
    setEditModalOpen(true);
  };

  const handleStop = (giveaway: GiveawayData) => {
    setSelectedGiveaway(giveaway);
    setStopModalOpen(true);
  };

  const handleReroll = (giveaway: GiveawayData) => {
    setSelectedGiveaway(giveaway);
    setRerollModalOpen(true);
  };

  const closeModals = () => {
    setEditModalOpen(false);
    setStopModalOpen(false);
    setRerollModalOpen(false);
    setSelectedGiveaway(null);
  };

  const guildQuery = useQuery({
    ...trpc.giveaways.getGuildGiveaways.queryOptions({ guildId }),
    enabled: isAuthenticated,
  });

  const giveaways = guildQuery.data?.giveaways ?? [];
  const counts = guildQuery.data?.counts;
  const activeCount = counts?.active ?? 0;
  const closedCount = counts?.closed ?? 0;
  const totalCount = counts?.total ?? 0;

  const filteredGiveaways = useMemo(() => {
    let filtered = giveaways;
    if (filter === "active") {
      filtered = filtered.filter((g) => g.state !== "CLOSED");
    } else if (filter === "closed") {
      filtered = filtered.filter((g) => g.state === "CLOSED");
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((g) => g.prize.toLowerCase().includes(query));
    }

    return [...filtered].sort((a, b) => {
      if (sort === "endTime") {
        return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
      }
      if (sort === "prize") {
        return a.prize.localeCompare(b.prize);
      }
      return 0;
    });
  }, [filter, sort, searchQuery, giveaways]);

  const isFilteredEmpty = filteredGiveaways.length === 0 && totalCount > 0;

  if (!isAuthenticated) {
    return <NotLoggedIn />;
  }

  if (guildQuery.isLoading) {
    return <GiveawayListSkeleton />;
  }

  if (guildQuery.error) {
    return (
      <ErrorDisplay
        error={guildQuery.error}
        onRetry={() => guildQuery.refetch()}
        notFoundConfig={GUILD_NOT_FOUND_CONFIG}
      />
    );
  }

  const { guild } = guildQuery.data ?? {
    guild: null,
    giveaways: [],
  };

  if (!guild) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconInfoCircle aria-hidden="true" />}
          color="yellow"
          variant="light"
        >
          {t("giveaways.guildDataUnavailable")}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Paper withBorder p="md">
          <Group justify="space-between" wrap="wrap" gap="md">
            <Group gap="md">
              <SegmentedControl
                data={[
                  {
                    label: t("giveaways.filters.all", { count: totalCount }),
                    value: "all" as FilterValue,
                  },
                  {
                    label: t("giveaways.filters.active", {
                      count: activeCount,
                    }),
                    value: "active" as FilterValue,
                  },
                  {
                    label: t("giveaways.filters.closed", {
                      count: closedCount,
                    }),
                    value: "closed" as FilterValue,
                  },
                ]}
                value={filter}
                onChange={(v) => setFilter(v as FilterValue)}
              />
              <Select
                placeholder={t("giveaways.sort.placeholder")}
                data={[
                  { value: "endTime", label: t("giveaways.sort.endTime") },
                  { value: "prize", label: t("giveaways.sort.prizeName") },
                ]}
                value={sort}
                onChange={(v) => setSort(v as SortValue)}
                w={150}
                leftSection={<IconSortAscending size={16} aria-hidden="true" />}
              />
            </Group>
            <TextInput
              placeholder={t("giveaways.search.placeholder")}
              leftSection={<IconSearch size={16} aria-hidden="true" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              w={250}
            />
          </Group>
        </Paper>

        {filteredGiveaways.length === 0 ? (
          isFilteredEmpty ? (
            <Alert
              icon={<IconFilter aria-hidden="true" />}
              color="yellow"
              variant="light"
            >
              {t("giveaways.noMatchingGiveaways")}
            </Alert>
          ) : (
            <Paper p="xl" radius="md" withBorder>
              <Stack align="center" gap="md" py="xl">
                <ThemeIcon size={64} radius="xl" variant="light" color="indigo">
                  <IconGift size={32} aria-hidden="true" />
                </ThemeIcon>
                <Title order={3} ta="center">
                  {t("giveaways.emptyState.title")}
                </Title>
                <Text c="dimmed" ta="center" maw={400}>
                  {t("giveaways.emptyState.description")}
                </Text>
                <Group gap="sm">
                  <Button
                    component="a"
                    href="https://discord.com/channels/@me"
                    target="_blank"
                    rel="noopener noreferrer"
                    leftSection={
                      <IconExternalLink size={16} aria-hidden="true" />
                    }
                  >
                    {t("giveaways.emptyState.openDiscord")}
                  </Button>
                  <Button
                    component={Link}
                    to="/wiki/getting-started/quick-start"
                    variant="light"
                  >
                    {t("giveaways.emptyState.learnHow")}
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {filteredGiveaways.map((giveaway) => (
              <GiveawayCard
                key={giveaway.messageId}
                giveaway={giveaway}
                guildId={guildId}
                onEdit={handleEdit}
                onStop={handleStop}
                onReroll={handleReroll}
              />
            ))}
          </SimpleGrid>
        )}
      </Stack>

      {selectedGiveaway && (
        <>
          <EditGiveawayModal
            opened={editModalOpen}
            onClose={closeModals}
            giveaway={selectedGiveaway}
            guildId={guildId}
          />
          <StopGiveawayModal
            opened={stopModalOpen}
            onClose={closeModals}
            giveaway={selectedGiveaway}
            guildId={guildId}
          />
          <RerollWinnersModal
            opened={rerollModalOpen}
            onClose={closeModals}
            giveaway={selectedGiveaway}
            guildId={guildId}
          />
        </>
      )}
    </Container>
  );
}
