import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCalendar,
  IconClock,
  IconRefresh,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { useAuth } from "~/components/AuthContext/AuthContext";
import { noIndexMeta } from "~/utils/seo";

type CreateSearch = {
  prize?: string;
  winners?: number;
  durationMs?: number;
  description?: string;
};

export const Route = createFileRoute("/guilds/$guildId/create")({
  head: () => ({
    meta: [{ title: "Create Giveaway | GiveawayBot" }, ...noIndexMeta],
  }),
  validateSearch: (raw: Record<string, unknown>): CreateSearch => ({
    prize: typeof raw.prize === "string" ? raw.prize : undefined,
    winners: Number.isFinite(Number(raw.winners))
      ? Number(raw.winners)
      : undefined,
    durationMs: Number.isFinite(Number(raw.durationMs))
      ? Number(raw.durationMs)
      : undefined,
    description:
      typeof raw.description === "string" ? raw.description : undefined,
  }),
  component: CreateGiveawayRoute,
});

function DiscordEmbedPreview({
  prize,
  winners,
  t,
}: {
  prize: string;
  winners: number;
  t: TFunction;
}) {
  const displayPrize = prize.trim() || t("giveaways.create.prizePlaceholder");

  return (
    <Stack gap="xs">
      <Text
        size="xs"
        fw={600}
        c="dimmed"
        tt="uppercase"
        style={{ letterSpacing: "0.08em" }}
      >
        {t("giveaways.create.preview.label")}
      </Text>
      <Box
        style={{
          background: "#36393f",
          borderRadius: 8,
          padding: 14,
          borderLeft: "4px solid var(--mantine-color-indigo-6)",
        }}
      >
        <Group gap={10} align="flex-start">
          <Box
            style={{
              width: 32,
              height: 32,
              background: "var(--mantine-color-indigo-6)",
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🎉
          </Box>
          <Stack gap={4}>
            <Text
              size="xs"
              fw={700}
              c="#72767d"
              tt="uppercase"
              style={{ letterSpacing: "0.06em" }}
            >
              {t("giveaways.create.preview.giveaway")}
            </Text>
            <Text size="sm" fw={700} c="#ffffff">
              {displayPrize}
            </Text>
            <Text size="xs" c="#b9bbbe">
              {t("giveaways.create.preview.enterCta")}
            </Text>
            <Text size="xs" c="#b9bbbe">
              {t("giveaways.create.preview.ends")} · {winners}{" "}
              {winners === 1 ? "winner" : "winners"}
            </Text>
            <Group gap={6} mt={4}>
              <Box
                style={{
                  background: "#40444b",
                  borderRadius: 4,
                  padding: "3px 8px",
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13 }}>🎉</span>
                <Text size="xs" c="#dcddde">
                  0
                </Text>
              </Box>
            </Group>
          </Stack>
        </Group>
      </Box>
      <Text size="xs" c="dimmed" ta="center">
        {t("giveaways.create.preview.liveHint")}
      </Text>
    </Stack>
  );
}

function CreateGiveawayRoute() {
  const { guildId } = Route.useParams();
  const search = Route.useSearch();
  const { t, i18n } = useTranslation();
  const { trpc } = Route.useRouteContext();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const resourcesQuery = useQuery({
    ...trpc.guild.getGuildResources.queryOptions({ guildId }),
    enabled: isAuthenticated,
  });

  const channelOptions = (resourcesQuery.data?.channels ?? []).map((c) => ({
    value: c.id,
    label: `#${c.name}`,
  }));

  const botNotInGuild = resourcesQuery.data?.botNotInGuild ?? false;

  const refreshMutation = useMutation(
    trpc.guild.refreshGuildResources.mutationOptions({
      onSuccess: () => resourcesQuery.refetch(),
      onError: (err) => {
        notifications.show({
          message:
            err.message === "Please wait before refreshing again."
              ? t("giveaways.create.refreshRateLimited")
              : t("giveaways.create.refreshError"),
          color: "orange",
        });
      },
    })
  );

  const createMutation = useMutation(
    trpc.giveaways.createGiveaway.mutationOptions({
      onSuccess: () => {
        notifications.show({
          title: t("giveaways.create.successTitle"),
          message: t("giveaways.create.successMessage"),
          color: "green",
        });
        navigate({ to: `/guilds/${guildId}/` });
      },
      onError: (err) => {
        notifications.show({
          title: t("giveaways.create.errorTitle"),
          message: err.message,
          color: "red",
        });
      },
    })
  );

  const form = useForm({
    initialValues: {
      prize: search.prize ?? "",
      winners: search.winners ?? 1,
      endDate: null as Date | null,
      endTime: "",
      channel: "",
      description: search.description ?? "",
    },
    validate: {
      prize: (v) =>
        !v.trim()
          ? t("giveaways.modals.edit.validation.prizeRequired")
          : v.length > 100
            ? t("giveaways.modals.edit.validation.prizeTooLong")
            : null,
      winners: (v) =>
        v < 1
          ? t("giveaways.modals.edit.validation.winnersMin")
          : v > 50
            ? t("giveaways.modals.edit.validation.winnersMax")
            : null,
      endDate: (v) => (!v ? t("giveaways.create.endDateRequired") : null),
      channel: (v) => (!v ? t("giveaways.create.channelRequired") : null),
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    if (!values.endDate) return;

    // Combine date and time in local time
    const combined = new Date(values.endDate);
    if (values.endTime) {
      const [hours, minutes] = values.endTime.split(":").map(Number);
      combined.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    } else {
      combined.setHours(23, 59, 0, 0);
    }

    createMutation.mutate({
      guildId,
      channelId: values.channel,
      prize: values.prize,
      winners: values.winners,
      endTime: combined.toISOString(),
      description: values.description || undefined,
      locale: i18n.language,
    });
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={1}>{t("giveaways.create.title")}</Title>
          <Text c="dimmed">{t("giveaways.create.subtitle")}</Text>
        </Stack>

        {botNotInGuild && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="orange"
            title={t("giveaways.create.botNotInGuildTitle")}
          >
            {t("giveaways.create.botNotInGuildMessage")}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Group gap={24} align="flex-start">
            <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
              <Paper withBorder p="md">
                <Stack gap="md">
                  <Stack gap={5}>
                    <Group gap={4}>
                      <Text size="sm" fw={500}>
                        {t("giveaways.create.prize")}{" "}
                        <Text component="span" c="red">
                          *
                        </Text>
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {t("giveaways.create.prizeHint")}
                    </Text>
                    <TextInput
                      placeholder={t("giveaways.create.prizePlaceholder")}
                      maxLength={100}
                      rightSection={
                        <Text size="xs" c="dimmed">
                          {form.values.prize.length}/100
                        </Text>
                      }
                      rightSectionWidth={50}
                      {...form.getInputProps("prize")}
                    />
                  </Stack>

                  <Divider />

                  <Group gap="md" align="flex-start" wrap="wrap">
                    <Stack gap={5}>
                      <Text size="sm" fw={500}>
                        {t("giveaways.create.winners")}{" "}
                        <Text component="span" c="red">
                          *
                        </Text>
                      </Text>
                      <NumberInput
                        min={1}
                        max={50}
                        style={{ width: 120 }}
                        {...form.getInputProps("winners")}
                      />
                    </Stack>
                    <Stack gap={5} style={{ flex: 1, minWidth: 140 }}>
                      <Text size="sm" fw={500}>
                        {t("giveaways.create.endDate")}{" "}
                        <Text component="span" c="red">
                          *
                        </Text>
                      </Text>
                      <DateInput
                        leftSection={
                          <IconCalendar size={16} aria-hidden="true" />
                        }
                        placeholder="MM/DD/YYYY"
                        minDate={new Date()}
                        {...form.getInputProps("endDate")}
                      />
                    </Stack>
                    <Stack gap={5} style={{ flex: 1, minWidth: 120 }}>
                      <Text size="sm" fw={500}>
                        {t("giveaways.create.endTime")}
                      </Text>
                      <TimeInput
                        leftSection={<IconClock size={16} aria-hidden="true" />}
                        {...form.getInputProps("endTime")}
                      />
                    </Stack>
                  </Group>

                  <Divider />

                  <Stack gap={5}>
                    <Group justify="space-between" align="center">
                      <Text size="sm" fw={500}>
                        {t("giveaways.create.channel")}{" "}
                        <Text component="span" c="red">
                          *
                        </Text>
                      </Text>
                      <Tooltip
                        label={t("giveaways.create.refreshChannelsRoles")}
                      >
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          loading={refreshMutation.isPending}
                          disabled={resourcesQuery.isLoading}
                          onClick={() => refreshMutation.mutate({ guildId })}
                        >
                          <IconRefresh size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {t("giveaways.create.channelHint")}
                    </Text>
                    <Select
                      placeholder={t("giveaways.create.channelPlaceholder")}
                      data={channelOptions}
                      disabled={botNotInGuild}
                      searchable
                      {...form.getInputProps("channel")}
                    />
                  </Stack>

                  <Divider />

                  <Stack gap={5}>
                    <Text size="sm" fw={500}>
                      {t("giveaways.create.description")}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t("giveaways.create.descriptionHint")}
                    </Text>
                    <Textarea
                      placeholder={t("giveaways.create.descriptionPlaceholder")}
                      rows={3}
                      maxLength={1000}
                      {...form.getInputProps("description")}
                    />
                  </Stack>
                </Stack>
              </Paper>

              <Group justify="flex-end" gap="sm">
                <Button
                  component={Link}
                  to={`/guilds/${guildId}/`}
                  variant="light"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  leftSection="🎉"
                  loading={createMutation.isPending}
                  disabled={botNotInGuild}
                >
                  {t("giveaways.create.launch")}
                </Button>
              </Group>
            </Stack>

            <Box style={{ width: 280, flexShrink: 0 }}>
              <DiscordEmbedPreview
                prize={form.values.prize}
                winners={form.values.winners}
                t={t}
              />
            </Box>
          </Group>
        </form>
      </Stack>
    </Container>
  );
}
