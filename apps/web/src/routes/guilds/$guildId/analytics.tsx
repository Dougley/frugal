import { BarChart, DonutChart } from "@mantine/charts";
import {
  Box,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconChartBar,
  IconConfetti,
  IconCrown,
  IconHash,
  IconUsers,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "~/components/AuthContext/AuthContext";
import { noIndexMeta } from "~/utils/seo";

export const Route = createFileRoute("/guilds/$guildId/analytics")({
  head: () => ({
    meta: [{ title: "Analytics | GiveawayBot" }, ...noIndexMeta],
  }),
  component: GuildAnalyticsRoute,
});

function formatDate(endTime: string) {
  try {
    return new Date(endTime).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return endTime;
  }
}

function formatMonth(ym: string) {
  try {
    const [year, month] = ym.split("-");
    return new Date(Number(year), Number(month) - 1).toLocaleDateString(
      undefined,
      { month: "short", year: "2-digit" }
    );
  } catch {
    return ym;
  }
}

function PremiumGate({ feature }: { feature: string }) {
  const { t } = useTranslation();
  return (
    <Paper withBorder p="xl">
      <Stack align="center" gap="md" py="xl">
        <ThemeIcon size={64} radius="xl" variant="light" color="yellow">
          <IconCrown size={32} aria-hidden="true" />
        </ThemeIcon>
        <Title order={3} ta="center">
          {t("errors.premiumRequired.title")}
        </Title>
        <Text c="dimmed" ta="center" maw={400}>
          {feature}
        </Text>
        <Button
          component={Link}
          to="/premium"
          leftSection={<IconCrown size={16} aria-hidden="true" />}
          color="yellow"
        >
          {t("errors.premiumRequired.action")}
        </Button>
      </Stack>
    </Paper>
  );
}

const PIE_COLORS = ["indigo", "pink", "lime", "yellow", "cyan"];

function GuildAnalyticsRoute() {
  const { isAuthenticated } = useAuth();
  const { trpc } = Route.useRouteContext();
  const { guildId } = Route.useParams();
  const { t } = useTranslation();

  const guildInfoQuery = useQuery({
    ...trpc.giveaways.getGuildInfo.queryOptions({ guildId }),
    enabled: isAuthenticated,
  });

  const isPremium = guildInfoQuery.data?.isPremium ?? false;
  const infoReady = !guildInfoQuery.isLoading;

  const analyticsQuery = useQuery({
    ...trpc.giveaways.getGuildAnalytics.queryOptions({ guildId }),
    enabled: isAuthenticated && isPremium,
  });

  const data = analyticsQuery.data;
  const isLoading = analyticsQuery.isLoading || guildInfoQuery.isLoading;

  const stats = [
    {
      value: isLoading ? null : String(data?.total ?? 0),
      label: t("giveaways.analytics.totalGiveaways"),
      icon: <IconConfetti size={16} aria-hidden="true" />,
    },
    {
      value: isLoading ? null : (data?.totalEntries ?? 0).toLocaleString(),
      label: t("giveaways.analytics.uniqueParticipants"),
      icon: <IconUsers size={16} aria-hidden="true" />,
    },
    {
      value: isLoading ? null : String(data?.avgEntries ?? 0),
      label: t("giveaways.analytics.avgParticipants"),
      icon: <IconChartBar size={16} aria-hidden="true" />,
    },
    {
      value: isLoading
        ? null
        : data?.mostActiveChannelId
          ? `#${data.mostActiveChannelId}`
          : "—",
      label: t("giveaways.analytics.mostActiveChannel"),
      icon: <IconHash size={16} aria-hidden="true" />,
    },
  ];

  const barData = (data?.byMonth ?? []).map((r) => ({
    month: formatMonth(r.month),
    Entries: r.entries,
  }));

  const donutData = (data?.winnerDistribution ?? []).map((r, i) => ({
    name: r.winners === 1 ? "1 winner" : `${r.winners} winners`,
    value: r.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={1}>{t("giveaways.analytics.title")}</Title>
          <Text c="dimmed">{t("giveaways.analytics.subtitle")}</Text>
        </Stack>

        {infoReady && !isPremium ? (
          <PremiumGate feature={t("giveaways.analytics.premiumDescription")} />
        ) : (
          <>
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              {stats.map((stat) => (
                <Paper withBorder p="md" key={stat.label}>
                  <Stack gap="xs">
                    <Group gap="xs">
                      <span style={{ fontSize: 16 }}>{stat.icon}</span>
                      <Text size="xs" c="dimmed">
                        {stat.label}
                      </Text>
                    </Group>
                    {stat.value === null ? (
                      <Skeleton height={28} width={60} />
                    ) : (
                      <Text size="xl" fw={700}>
                        {stat.value}
                      </Text>
                    )}
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>

            <Paper withBorder p="md">
              <Stack gap="md">
                <Text fw={600}>
                  {t("giveaways.analytics.participationOverTime")}
                </Text>
                {isLoading ? (
                  <Skeleton height={160} />
                ) : barData.length === 0 ? (
                  <Box
                    style={{
                      height: 160,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text size="sm" c="dimmed">
                      No data yet
                    </Text>
                  </Box>
                ) : (
                  <BarChart
                    h={160}
                    data={barData}
                    dataKey="month"
                    series={[{ name: "Entries", color: "indigo.6" }]}
                    barProps={{ radius: 3 }}
                    withTooltip
                    withXAxis
                    withYAxis
                  />
                )}
              </Stack>
            </Paper>

            <Group gap="md" align="flex-start">
              <Paper withBorder p="md" style={{ flex: 2 }}>
                <Stack gap="sm">
                  <Text fw={600}>{t("giveaways.analytics.topGiveaways")}</Text>
                  <Divider />
                  <Group gap={0} px={6}>
                    <Text size="xs" c="dimmed" style={{ flex: 3 }}>
                      {t("giveaways.analytics.prize")}
                    </Text>
                    <Text size="xs" c="dimmed" ta="right" style={{ flex: 1 }}>
                      {t("giveaways.analytics.participants")}
                    </Text>
                    <Text size="xs" c="dimmed" ta="right" style={{ flex: 1 }}>
                      {t("giveaways.analytics.winners")}
                    </Text>
                    <Text size="xs" c="dimmed" ta="right" style={{ flex: 1 }}>
                      {t("giveaways.analytics.date")}
                    </Text>
                  </Group>
                  {isLoading
                    ? (["a", "b", "c", "d", "e"] as const).map((k) => (
                        <Stack key={k} gap={0}>
                          <Divider />
                          <Group gap={0} px={6} py={6}>
                            <Skeleton
                              height={16}
                              style={{ flex: 3, marginRight: 8 }}
                            />
                            <Skeleton height={16} width={40} ml="auto" />
                          </Group>
                        </Stack>
                      ))
                    : (data?.topGiveaways ?? []).map((row) => (
                        <Stack key={`${row.prize}-${row.endTime}`} gap={0}>
                          <Divider />
                          <Group gap={0} px={6} py={4}>
                            <Text size="sm" style={{ flex: 3 }}>
                              {row.prize}
                            </Text>
                            <Text size="sm" ta="right" style={{ flex: 1 }}>
                              {row.participants.toLocaleString()}
                            </Text>
                            <Text size="sm" ta="right" style={{ flex: 1 }}>
                              {row.winners}
                            </Text>
                            <Text
                              size="sm"
                              c="dimmed"
                              ta="right"
                              style={{ flex: 1 }}
                            >
                              {formatDate(row.endTime)}
                            </Text>
                          </Group>
                        </Stack>
                      ))}
                </Stack>
              </Paper>

              <Stack gap="md" style={{ flex: 1 }}>
                <Paper withBorder p="md">
                  <Stack gap="sm">
                    <Text fw={600}>
                      {t("giveaways.analytics.winnerDistribution")}
                    </Text>
                    {isLoading ? (
                      <Skeleton height={150} />
                    ) : donutData.length === 0 ? (
                      <Box
                        style={{
                          height: 150,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text size="sm" c="dimmed">
                          No data yet
                        </Text>
                      </Box>
                    ) : (
                      <DonutChart
                        data={donutData}
                        size={150}
                        thickness={25}
                        withTooltip
                        mx="auto"
                      />
                    )}
                  </Stack>
                </Paper>
                <Paper withBorder p="md">
                  <Stack gap="sm">
                    <Text fw={600}>
                      {t("giveaways.analytics.activeVsClosed")}
                    </Text>
                    {isLoading ? (
                      <Group gap="xl" mt={4}>
                        <Skeleton height={28} width={40} />
                        <Skeleton height={28} width={40} />
                      </Group>
                    ) : (
                      <Group gap="xl" mt={4}>
                        <Stack gap={2}>
                          <Text size="xl" fw={700} c="pink">
                            {data?.active ?? 0}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {t("giveaways.analytics.active")}
                          </Text>
                        </Stack>
                        <Stack gap={2}>
                          <Text size="xl" fw={700} c="dimmed">
                            {data?.closed ?? 0}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {t("giveaways.analytics.closed")}
                          </Text>
                        </Stack>
                      </Group>
                    )}
                  </Stack>
                </Paper>
              </Stack>
            </Group>
          </>
        )}
      </Stack>
    </Container>
  );
}
