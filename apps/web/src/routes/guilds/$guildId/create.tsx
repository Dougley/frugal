import {
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
} from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCalendar, IconClock } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { noIndexMeta } from "~/utils/seo";

export const Route = createFileRoute("/guilds/$guildId/create")({
  head: () => ({
    meta: [{ title: "Create Giveaway | GiveawayBot" }, ...noIndexMeta],
  }),
  component: CreateGiveawayRoute,
});

const MOCK_CHANNELS = [
  { value: "giveaways", label: "#giveaways" },
  { value: "prizes", label: "#prizes" },
  { value: "events", label: "#events" },
  { value: "general", label: "#general" },
];

const MOCK_ROLES = [
  { value: "member", label: "@Member" },
  { value: "verified", label: "@Verified" },
  { value: "nitro", label: "@Nitro Booster" },
  { value: "vip", label: "@VIP" },
];

function DiscordEmbedPreview({
  prize,
  winners,
}: {
  prize: string;
  winners: number;
}) {
  const displayPrize = prize.trim() || "Prize name";

  return (
    <Stack gap="xs">
      <Text
        size="xs"
        fw={600}
        c="dimmed"
        tt="uppercase"
        style={{ letterSpacing: "0.08em" }}
      >
        Discord embed preview
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
              Giveaway
            </Text>
            <Text size="sm" fw={700} c="#ffffff">
              {displayPrize}
            </Text>
            <Text size="xs" c="#b9bbbe">
              React with 🎉 to enter!
            </Text>
            <Text size="xs" c="#b9bbbe">
              Ends in 7 days · {winners} {winners === 1 ? "winner" : "winners"}
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
        Updates live as you fill in the form
      </Text>
    </Stack>
  );
}

function CreateGiveawayRoute() {
  const { guildId } = Route.useParams();
  const { t } = useTranslation();

  const form = useForm({
    initialValues: {
      prize: "",
      winners: 1,
      endDate: null as Date | null,
      endTime: "",
      channel: "",
      requiredRole: "",
      blacklistedRole: "",
      description: "",
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
    },
  });

  const handleSubmit = (_values: typeof form.values) => {
    notifications.show({
      title: t("giveaways.create.comingSoonTitle"),
      message: t("giveaways.create.comingSoonMessage"),
      color: "indigo",
    });
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={1}>{t("giveaways.create.title")}</Title>
          <Text c="dimmed">{t("giveaways.create.subtitle")}</Text>
        </Stack>

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
                        {...form.getInputProps("endDate")}
                      />
                    </Stack>
                    <Stack gap={5} style={{ flex: 1, minWidth: 120 }}>
                      <Text size="sm" fw={500}>
                        {t("giveaways.create.endTime")}{" "}
                        <Text component="span" c="red">
                          *
                        </Text>
                      </Text>
                      <TimeInput
                        leftSection={<IconClock size={16} aria-hidden="true" />}
                        {...form.getInputProps("endTime")}
                      />
                    </Stack>
                  </Group>

                  <Divider />

                  <Stack gap={5}>
                    <Text size="sm" fw={500}>
                      {t("giveaways.create.channel")}{" "}
                      <Text component="span" c="red">
                        *
                      </Text>
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t("giveaways.create.channelHint")}
                    </Text>
                    <Select
                      placeholder={t("giveaways.create.channelPlaceholder")}
                      data={MOCK_CHANNELS}
                      {...form.getInputProps("channel")}
                    />
                  </Stack>

                  <Group gap="md" align="flex-start" grow>
                    <Stack gap={5}>
                      <Text size="sm" fw={500}>
                        {t("giveaways.create.requiredRole")}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t("giveaways.create.requiredRoleHint")}
                      </Text>
                      <Select
                        placeholder={t("giveaways.create.rolePlaceholder")}
                        data={MOCK_ROLES}
                        clearable
                        {...form.getInputProps("requiredRole")}
                      />
                    </Stack>
                    <Stack gap={5}>
                      <Text size="sm" fw={500}>
                        {t("giveaways.create.blacklistedRole")}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t("giveaways.create.blacklistedRoleHint")}
                      </Text>
                      <Select
                        placeholder={t("giveaways.create.blacklistPlaceholder")}
                        data={MOCK_ROLES}
                        clearable
                        {...form.getInputProps("blacklistedRole")}
                      />
                    </Stack>
                  </Group>

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
                <Button type="submit" leftSection="🎉">
                  {t("giveaways.create.launch")}
                </Button>
              </Group>
            </Stack>

            <Box style={{ width: 280, flexShrink: 0 }}>
              <DiscordEmbedPreview
                prize={form.values.prize}
                winners={form.values.winners}
              />
            </Box>
          </Group>
        </form>
      </Stack>
    </Container>
  );
}
