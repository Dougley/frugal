import {
  Alert,
  Badge,
  Card,
  Code,
  Collapse,
  Container,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronDown, IconInfoCircle } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "~/components/AuthContext/AuthContext";
import { GuildCard } from "~/components/GuildCard";
import { NotLoggedIn } from "~/components/NotLoggedIn";
import { useLocalizedDayjs } from "~/lib/dayjs";
import { noIndexMeta } from "~/utils/seo";

/**
 * Giveaways overview route - shows guilds with giveaways and hosted giveaways
 *
 * Uses SSR prefetch for authenticated users to eliminate loading flash.
 */
export const Route = createFileRoute("/giveaways/overview")({
  loader: async ({ context }) => {
    // Prefetch both queries in parallel for authenticated users
    if (context.session) {
      await Promise.all([
        context.queryClient.ensureQueryData(
          context.trpc.giveaways.getGuildsWithGiveaways.queryOptions()
        ),
        context.queryClient.ensureQueryData(
          context.trpc.giveaways.getHostedGiveaways.queryOptions()
        ),
      ]);
    }
  },
  head: () => ({
    meta: [{ title: "Giveaways | GiveawayBot" }, ...noIndexMeta],
  }),
  component: GiveawaysOverviewRoute,
});

interface HostedGiveaway {
  messageId: string;
  prize: string;
  state: string;
  endTime: string;
  durableObjectId: string;
}

interface HostedGiveawaysSectionProps {
  hostedGiveaways: HostedGiveaway[];
}

function HostedGiveawaysSection({
  hostedGiveaways,
}: HostedGiveawaysSectionProps) {
  const [opened, setOpened] = useState(false);
  const { t } = useTranslation();
  const dayjs = useLocalizedDayjs();
  const panelId = useId();

  if (hostedGiveaways.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <UnstyledButton
        onClick={() => setOpened((o) => !o)}
        aria-expanded={opened}
        aria-controls={panelId}
      >
        <Group>
          <IconChevronDown
            size={24}
            style={{
              transform: opened ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease",
            }}
            aria-hidden="true"
          />
          <Title order={2}>{t("giveaways.hostedGiveaways")}</Title>
          <Badge size="lg" variant="light">
            {hostedGiveaways.length}
          </Badge>
        </Group>
      </UnstyledButton>

      <Collapse in={opened} id={panelId}>
        <Alert
          icon={<IconInfoCircle aria-hidden="true" />}
          color="indigo"
          variant="light"
        >
          {t("giveaways.hostedDescription")}
        </Alert>

        <Stack gap="sm" mt="md">
          {hostedGiveaways.map((giveaway) => (
            <Card key={giveaway.messageId} shadow="sm" radius="md" withBorder>
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  {giveaway.prize}
                </Text>
                <Group gap="xs">
                  <Badge
                    size="sm"
                    variant="light"
                    color={giveaway.state === "CLOSED" ? "gray" : "pink"}
                  >
                    {giveaway.state === "CLOSED"
                      ? t("giveaways.status.closed")
                      : t("giveaways.status.active")}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {giveaway.state === "CLOSED"
                      ? t("giveaways.ended", {
                          time: dayjs(giveaway.endTime).fromNow(),
                        })
                      : t("giveaways.ends", {
                          time: dayjs(giveaway.endTime).fromNow(),
                        })}
                  </Text>
                </Group>
                <Code block>{giveaway.messageId}</Code>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Collapse>
    </Stack>
  );
}

function GuildCardSkeleton() {
  return (
    <Card shadow="sm" radius="md" withBorder>
      <Group>
        <Skeleton height={40} circle />
        <Skeleton height={20} width={120} />
      </Group>
    </Card>
  );
}

function GuildsLoadingSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
      <GuildCardSkeleton key="skeleton-1" />
      <GuildCardSkeleton key="skeleton-2" />
      <GuildCardSkeleton key="skeleton-3" />
      <GuildCardSkeleton key="skeleton-4" />
      <GuildCardSkeleton key="skeleton-5" />
      <GuildCardSkeleton key="skeleton-6" />
    </SimpleGrid>
  );
}

function GiveawaysOverviewRoute() {
  const { isAuthenticated } = useAuth();
  const { trpc } = Route.useRouteContext();
  const { t } = useTranslation();

  const guildsQuery = useQuery({
    ...trpc.giveaways.getGuildsWithGiveaways.queryOptions(),
    enabled: isAuthenticated,
  });
  const hostedQuery = useQuery({
    ...trpc.giveaways.getHostedGiveaways.queryOptions(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <NotLoggedIn />;
  }

  const isLoading = guildsQuery.isLoading || hostedQuery.isLoading;
  const guilds = guildsQuery.data?.guilds ?? [];
  const hosted = hostedQuery.data?.giveaways ?? [];

  return (
    <Container size="lg" py="xl">
      <Stack gap={40}>
        <Stack gap="md">
          <Title order={1}>{t("giveaways.title")}</Title>
          <Text c="dimmed">{t("giveaways.description")}</Text>
        </Stack>

        {!isLoading && hosted.length > 0 && (
          <HostedGiveawaysSection hostedGiveaways={hosted} />
        )}

        <Stack gap="md">
          <Title order={2}>{t("giveaways.serversWithGiveaways")}</Title>

          {guildsQuery.error ? (
            <Alert
              icon={<IconInfoCircle aria-hidden="true" />}
              color="red"
              variant="light"
            >
              {t("errors.failedToLoad", {
                item: "guilds",
                error: guildsQuery.error.message,
              })}
            </Alert>
          ) : isLoading ? (
            <GuildsLoadingSkeleton />
          ) : guilds.length === 0 ? (
            <Alert
              icon={<IconInfoCircle aria-hidden="true" />}
              color="indigo"
              variant="light"
            >
              {t("giveaways.noGiveaways")}
            </Alert>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
              {guilds.map((guild) => (
                <GuildCard key={guild.id} guild={guild} />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
