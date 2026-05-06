import {
  ActionIcon,
  Alert,
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
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconDeviceFloppy,
  IconRefresh,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "~/components/AuthContext/AuthContext";
import { noIndexMeta } from "~/utils/seo";

export const Route = createFileRoute("/guilds/$guildId/settings")({
  head: () => ({
    meta: [{ title: "Server Settings | GiveawayBot" }, ...noIndexMeta],
  }),
  component: ServerSettingsRoute,
});

function ServerSettingsRoute() {
  const { isAuthenticated } = useAuth();
  const { trpc } = Route.useRouteContext();
  const { guildId } = Route.useParams();
  const { t } = useTranslation();

  const settingsQuery = useQuery({
    ...trpc.settings.getGuildSettings.queryOptions({ guildId }),
    enabled: isAuthenticated,
  });

  const resourcesQuery = useQuery({
    ...trpc.guild.getGuildResources.queryOptions({ guildId }),
    enabled: isAuthenticated,
  });

  const channelOptions = (resourcesQuery.data?.channels ?? []).map((c) => ({
    value: c.id,
    label: `#${c.name}`,
  }));

  const roleOptions = (resourcesQuery.data?.roles ?? []).map((r) => ({
    value: r.id,
    label: `@${r.name}`,
  }));

  const refreshMutation = useMutation(
    trpc.guild.refreshGuildResources.mutationOptions({
      onSuccess: (fresh) => {
        resourcesQuery.refetch();
        if (fresh.botNotInGuild) return;
        notifications.show({
          message: t("giveaways.settings.resourcesRefreshed"),
          color: "green",
        });
      },
      onError: (err) => {
        notifications.show({
          message:
            err.message === "Please wait before refreshing again."
              ? t("giveaways.settings.refreshRateLimited")
              : t("giveaways.settings.saveErrorMessage"),
          color: "orange",
        });
      },
    })
  );

  const form = useForm({
    initialValues: {
      defaultChannelId: "",
      pingRoleId: "",
      requiredRoles: [] as string[],
      accentColor: "#4c6ef5",
    },
  });

  useEffect(() => {
    if (settingsQuery.data && !form.isDirty()) {
      const d = settingsQuery.data;
      form.setValues({
        defaultChannelId: d.defaultChannelId ?? "",
        pingRoleId: d.pingRoleId ?? "",
        requiredRoles: d.requiredRoles ?? [],
        accentColor: d.accentColor ?? "#4c6ef5",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsQuery.data]);

  const updateMutation = useMutation(
    trpc.settings.updateGuildSettings.mutationOptions({
      onSuccess: () => {
        notifications.show({
          title: t("giveaways.settings.saved"),
          message: t("giveaways.settings.savedMessage"),
          color: "green",
        });
      },
      onError: () => {
        notifications.show({
          title: t("giveaways.settings.saveError"),
          message: t("giveaways.settings.saveErrorMessage"),
          color: "red",
        });
      },
    })
  );

  const handleSave = form.onSubmit((values) => {
    updateMutation.mutate({
      guildId,
      defaultChannelId: values.defaultChannelId || null,
      pingRoleId: values.pingRoleId || null,
      requiredRoles: values.requiredRoles,
      accentColor: values.accentColor,
    });
  });

  const isLoading = settingsQuery.isLoading || resourcesQuery.isLoading;
  const botNotInGuild = resourcesQuery.data?.botNotInGuild ?? false;

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={1}>{t("giveaways.settings.title")}</Title>
          <Text c="dimmed">{t("giveaways.settings.subtitle")}</Text>
        </Stack>

        {botNotInGuild && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="orange"
            title={t("giveaways.settings.botNotInGuildTitle")}
          >
            {t("giveaways.settings.botNotInGuildMessage")}
          </Alert>
        )}

        <Paper withBorder p="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>{t("giveaways.settings.defaults")}</Text>
              <Tooltip label={t("giveaways.settings.refreshChannelsRoles")}>
                <ActionIcon
                  variant="subtle"
                  loading={refreshMutation.isPending}
                  disabled={isLoading}
                  onClick={() => refreshMutation.mutate({ guildId })}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Divider />

            <Stack gap={5}>
              <Text size="sm" fw={500}>
                {t("giveaways.settings.defaultChannel")}
              </Text>
              <Text size="xs" c="dimmed">
                {t("giveaways.settings.defaultChannelHint")}
              </Text>
              <Select
                placeholder={t("giveaways.settings.channelIdPlaceholder")}
                data={channelOptions}
                disabled={isLoading || botNotInGuild}
                searchable
                clearable
                {...form.getInputProps("defaultChannelId")}
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
                placeholder={t("giveaways.settings.pingRolePlaceholder")}
                data={roleOptions}
                disabled={isLoading || botNotInGuild}
                searchable
                clearable
                {...form.getInputProps("pingRoleId")}
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
                placeholder={t("giveaways.settings.requiredRolesPlaceholder")}
                data={roleOptions}
                disabled={isLoading || botNotInGuild}
                searchable
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
                  disabled={isLoading}
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

        <Group justify="flex-end" gap="sm">
          <Button component={Link} to={`/guilds/${guildId}/`} variant="light">
            {t("common.cancel")}
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} aria-hidden="true" />}
            loading={updateMutation.isPending}
            onClick={() => handleSave()}
          >
            {t("giveaways.settings.save")}
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
