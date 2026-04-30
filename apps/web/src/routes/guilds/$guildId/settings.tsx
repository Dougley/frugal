import {
  Button,
  ColorInput,
  Container,
  Divider,
  Group,
  MultiSelect,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { noIndexMeta } from "~/utils/seo";

export const Route = createFileRoute("/guilds/$guildId/settings")({
  head: () => ({
    meta: [{ title: "Server Settings | GiveawayBot" }, ...noIndexMeta],
  }),
  component: ServerSettingsRoute,
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
  { value: "moderator", label: "@Moderator" },
];

function ServerSettingsRoute() {
  const { guildId } = Route.useParams();
  const { t } = useTranslation();

  const form = useForm({
    initialValues: {
      defaultChannel: "giveaways",
      managerRole: "",
      pingRole: "",
      requiredRoles: ["member"] as string[],
      accentColor: "#4c6ef5",
    },
  });

  const handleSave = () => {
    notifications.show({
      title: t("giveaways.settings.saved"),
      message: t("giveaways.settings.savedMessage"),
      color: "green",
      icon: "✓",
    });
  };

  const _handleError = () => {
    notifications.show({
      title: t("giveaways.settings.saveError"),
      message: t("giveaways.settings.saveErrorMessage"),
      color: "red",
    });
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={1}>{t("giveaways.settings.title")}</Title>
          <Text c="dimmed">{t("giveaways.settings.subtitle")}</Text>
        </Stack>

        <Paper withBorder p="md">
          <Stack gap="md">
            <Text fw={600}>{t("giveaways.settings.defaults")}</Text>
            <Divider />

            <Stack gap={5}>
              <Text size="sm" fw={500}>
                {t("giveaways.settings.defaultChannel")}
              </Text>
              <Text size="xs" c="dimmed">
                {t("giveaways.settings.defaultChannelHint")}
              </Text>
              <Select
                data={MOCK_CHANNELS}
                {...form.getInputProps("defaultChannel")}
              />
            </Stack>

            <Stack gap={5}>
              <Text size="sm" fw={500}>
                {t("giveaways.settings.managerRole")}
              </Text>
              <Text size="xs" c="dimmed">
                {t("giveaways.settings.managerRoleHint")}
              </Text>
              <Select
                placeholder={t("giveaways.create.rolePlaceholder")}
                data={MOCK_ROLES}
                clearable
                {...form.getInputProps("managerRole")}
              />
            </Stack>

            <Stack gap={5}>
              <Text size="sm" fw={500}>
                {t("giveaways.settings.pingRole")}
              </Text>
              <Text size="xs" c="dimmed">
                {t("giveaways.settings.pingRoleHint")}
              </Text>
              <Select
                placeholder="@here (default)"
                data={MOCK_ROLES}
                clearable
                {...form.getInputProps("pingRole")}
              />
            </Stack>
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Stack gap="md">
            <Text fw={600}>{t("giveaways.settings.entryRequirements")}</Text>
            <Divider />

            <Stack gap={5}>
              <Text size="sm" fw={500}>
                {t("giveaways.settings.requiredRoles")}
              </Text>
              <Text size="xs" c="dimmed">
                {t("giveaways.settings.requiredRolesHint")}
              </Text>
              <MultiSelect
                data={MOCK_ROLES}
                {...form.getInputProps("requiredRoles")}
              />
            </Stack>
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Stack gap="md">
            <Text fw={600}>{t("giveaways.settings.appearance")}</Text>
            <Divider />

            <Stack gap={5}>
              <Text size="sm" fw={500}>
                {t("giveaways.settings.accentColor")}
              </Text>
              <Text size="xs" c="dimmed">
                {t("giveaways.settings.accentColorHint")}
              </Text>
              <Group gap="sm" align="flex-end">
                <ColorInput
                  style={{ flex: 1, maxWidth: 240 }}
                  format="hex"
                  swatches={["#4c6ef5", "#e64980", "#84cc16", "#f59f00"]}
                  {...form.getInputProps("accentColor")}
                />
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => form.setFieldValue("accentColor", "#4c6ef5")}
                >
                  {t("giveaways.settings.reset")}
                </Button>
              </Group>
            </Stack>
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Stack gap={2}>
                <Text fw={600}>{t("giveaways.settings.blacklist")}</Text>
                <Text size="xs" c="dimmed">
                  {t("giveaways.settings.blacklistDesc")}
                </Text>
              </Stack>
              <Button variant="light" size="xs" leftSection="＋">
                {t("giveaways.settings.addUsers")}
              </Button>
            </Group>
            <Divider />
            <Paper withBorder p="xl" ta="center">
              <Text size="sm" c="dimmed">
                {t("giveaways.settings.noBlacklist")}
              </Text>
            </Paper>
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Stack gap={2}>
                <Text fw={600}>{t("giveaways.settings.allowlist")}</Text>
                <Text size="xs" c="dimmed">
                  {t("giveaways.settings.allowlistDesc")}
                </Text>
              </Stack>
              <Button variant="light" size="xs" leftSection="＋">
                {t("giveaways.settings.addUsers")}
              </Button>
            </Group>
            <Divider />
            <Paper withBorder p="xl" ta="center">
              <Text size="sm" c="dimmed">
                {t("giveaways.settings.allowlistDisabled")}
              </Text>
            </Paper>
          </Stack>
        </Paper>

        <Group justify="flex-end" gap="sm">
          <Button component={Link} to={`/guilds/${guildId}/`} variant="light">
            {t("common.cancel")}
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} aria-hidden="true" />}
            onClick={handleSave}
          >
            {t("giveaways.settings.save")}
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
