import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Menu,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCrown,
  IconDotsVertical,
  IconEdit,
  IconInfoCircle,
  IconPlayerPlay,
  IconPlus,
  IconTemplate,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "~/components/AuthContext/AuthContext";
import { noIndexMeta } from "~/utils/seo";

export const Route = createFileRoute("/guilds/$guildId/templates")({
  head: () => ({
    meta: [{ title: "Templates | GiveawayBot" }, ...noIndexMeta],
  }),
  component: GiveawayTemplatesRoute,
});

type Template = {
  id: string;
  name: string;
  prize: string | null;
  winners: number;
  durationMs: number;
  description: string | null;
  useCount: number;
};

const DURATION_OPTIONS = [
  { value: String(10 * 60 * 1000), label: "10 minutes" },
  { value: String(30 * 60 * 1000), label: "30 minutes" },
  { value: String(60 * 60 * 1000), label: "1 hour" },
  { value: String(6 * 60 * 60 * 1000), label: "6 hours" },
  { value: String(12 * 60 * 60 * 1000), label: "12 hours" },
  { value: String(24 * 60 * 60 * 1000), label: "1 day" },
  { value: String(3 * 24 * 60 * 60 * 1000), label: "3 days" },
  { value: String(7 * 24 * 60 * 60 * 1000), label: "7 days" },
  { value: String(14 * 24 * 60 * 60 * 1000), label: "14 days" },
  { value: String(30 * 24 * 60 * 60 * 1000), label: "30 days" },
];

function formatDuration(ms: number): string {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d${h > 0 ? ` ${h}h` : ""}`;
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ""}`;
  return `${m}m`;
}

function TemplateFormModal({
  opened,
  onClose,
  template,
  guildId,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  template: Template | null;
  guildId: string;
  onSaved: () => void;
}) {
  const { trpc } = Route.useRouteContext();
  const { t } = useTranslation();
  const isEdit = template !== null;

  const form = useForm({
    initialValues: {
      name: "",
      prize: "",
      winners: 1,
      durationMs: String(24 * 60 * 60 * 1000),
      description: "",
    },
    validate: {
      name: (v) =>
        !v.trim() ? t("giveaways.templates.form.nameRequired") : null,
      winners: (v) =>
        v < 1 || v > 50 ? t("giveaways.templates.form.winnersRange") : null,
    },
  });

  useEffect(() => {
    if (template) {
      form.setValues({
        name: template.name,
        prize: template.prize ?? "",
        winners: template.winners,
        durationMs: String(template.durationMs),
        description: template.description ?? "",
      });
    } else {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, opened]);

  const createMutation = useMutation(
    trpc.templates.createTemplate.mutationOptions({
      onSuccess: () => {
        notifications.show({
          message: t("giveaways.templates.notifications.created"),
          color: "green",
        });
        onSaved();
        onClose();
      },
      onError: (err) => {
        notifications.show({
          title: t("giveaways.templates.notifications.saveFailedTitle"),
          message: err.message,
          color: "red",
        });
      },
    })
  );

  const updateMutation = useMutation(
    trpc.templates.updateTemplate.mutationOptions({
      onSuccess: () => {
        notifications.show({
          message: t("giveaways.templates.notifications.updated"),
          color: "green",
        });
        onSaved();
        onClose();
      },
      onError: (err) => {
        notifications.show({
          title: t("giveaways.templates.notifications.saveFailedTitle"),
          message: err.message,
          color: "red",
        });
      },
    })
  );

  const handleSubmit = form.onSubmit((values) => {
    const payload = {
      guildId,
      name: values.name,
      prize: values.prize || undefined,
      winners: values.winners,
      durationMs: Number(values.durationMs),
      description: values.description || undefined,
    };

    if (isEdit && template) {
      updateMutation.mutate({ id: template.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        isEdit
          ? t("giveaways.templates.form.editTitle")
          : t("giveaways.templates.form.newTitle")
      }
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label={t("giveaways.templates.form.nameLabel")}
            placeholder={t("giveaways.templates.form.namePlaceholder")}
            required
            {...form.getInputProps("name")}
          />
          <TextInput
            label={t("giveaways.templates.form.prizeLabel")}
            placeholder={t("giveaways.templates.form.prizePlaceholder")}
            {...form.getInputProps("prize")}
          />
          <NumberInput
            label={t("giveaways.templates.form.winnersLabel")}
            min={1}
            max={50}
            {...form.getInputProps("winners")}
          />
          <Select
            label={t("giveaways.templates.form.durationLabel")}
            data={DURATION_OPTIONS}
            {...form.getInputProps("durationMs")}
          />
          <Textarea
            label={t("giveaways.templates.form.descriptionLabel")}
            placeholder={t("giveaways.templates.form.descriptionPlaceholder")}
            autosize
            minRows={2}
            maxRows={5}
            {...form.getInputProps("description")}
          />
          <Group justify="flex-end" gap="sm" mt="xs">
            <Button variant="light" onClick={onClose} disabled={isPending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={isPending}>
              {isEdit
                ? t("giveaways.templates.form.saveChanges")
                : t("giveaways.templates.form.create")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

function TemplateCard({
  template,
  onEdit,
  onDelete,
  onLaunch,
}: {
  template: Template;
  onEdit: (t: Template) => void;
  onDelete: (id: string) => void;
  onLaunch: (t: Template) => void;
}) {
  const { t } = useTranslation();

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Stack gap={6}>
            <Text fw={600} size="sm">
              {template.name}
            </Text>
            <Group gap={6}>
              <Badge variant="light" color="indigo" size="sm">
                {template.winners}w
              </Badge>
              <Badge variant="light" color="gray" size="sm">
                {formatDuration(template.durationMs)}
              </Badge>
              {template.prize && (
                <Badge variant="light" color="pink" size="sm">
                  {template.prize}
                </Badge>
              )}
            </Group>
          </Stack>
          <Menu withinPortal position="bottom-end" shadow="sm">
            <Menu.Target>
              <Button variant="subtle" size="compact-sm" px={4}>
                <IconDotsVertical size={16} aria-hidden="true" />
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={14} aria-hidden="true" />}
                onClick={() => onEdit(template)}
              >
                {t("giveaways.templates.edit")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={14} aria-hidden="true" />}
                color="red"
                onClick={() => onDelete(template.id)}
              >
                {t("common.delete")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {template.description && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {template.description}
          </Text>
        )}

        <Text size="xs" c="dimmed">
          {t("giveaways.templates.usedCount", { count: template.useCount })}
        </Text>

        <Divider />

        <Group gap="sm">
          <Button
            size="xs"
            leftSection={<IconPlayerPlay size={12} aria-hidden="true" />}
            onClick={() => onLaunch(template)}
          >
            {t("giveaways.templates.launch")}
          </Button>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconEdit size={12} aria-hidden="true" />}
            onClick={() => onEdit(template)}
          >
            {t("giveaways.templates.edit")}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

function GiveawayTemplatesRoute() {
  const { isAuthenticated } = useAuth();
  const { trpc } = Route.useRouteContext();
  const { guildId } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const guildInfoQuery = useQuery({
    ...trpc.giveaways.getGuildInfo.queryOptions({ guildId }),
    enabled: isAuthenticated,
  });

  const templatesQuery = useQuery({
    ...trpc.templates.getGuildTemplates.queryOptions({ guildId }),
    enabled: isAuthenticated && (guildInfoQuery.data?.isPremium ?? false),
  });

  const deleteMutation = useMutation(
    trpc.templates.deleteTemplate.mutationOptions({
      onSuccess: () => {
        notifications.show({
          message: t("giveaways.templates.notifications.deleted"),
          color: "green",
        });
        templatesQuery.refetch();
      },
      onError: () => {
        notifications.show({
          title: t("giveaways.templates.notifications.deleteFailedTitle"),
          message: t("giveaways.templates.notifications.deleteFailedMessage"),
          color: "red",
        });
      },
    })
  );

  const isPremium = guildInfoQuery.data?.isPremium ?? false;
  const infoReady = !guildInfoQuery.isLoading;
  const templates = templatesQuery.data ?? [];
  const isLoading = templatesQuery.isLoading && isPremium;

  const handleNew = () => {
    setEditingTemplate(null);
    openModal();
  };

  const handleEdit = (tpl: Template) => {
    setEditingTemplate(tpl);
    openModal();
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id, guildId });
  };

  const handleLaunch = (tpl: Template) => {
    navigate({
      to: "/guilds/$guildId/create",
      params: { guildId },
      search: {
        prize: tpl.prize ?? undefined,
        winners: tpl.winners,
        durationMs: tpl.durationMs,
        description: tpl.description ?? undefined,
      },
    });
  };

  return (
    <Container size="lg" py="xl">
      <TemplateFormModal
        opened={modalOpened}
        onClose={closeModal}
        template={editingTemplate}
        guildId={guildId}
        onSaved={() => templatesQuery.refetch()}
      />

      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Title order={1}>{t("giveaways.templates.title")}</Title>
            <Text c="dimmed">{t("giveaways.templates.subtitle")}</Text>
          </Stack>
          {isPremium && (
            <Button
              leftSection={<IconPlus size={16} aria-hidden="true" />}
              onClick={handleNew}
            >
              {t("giveaways.templates.new")}
            </Button>
          )}
        </Group>

        {infoReady && !isPremium ? (
          <Paper withBorder p="xl">
            <Stack align="center" gap="md" py="xl">
              <ThemeIcon size={64} radius="xl" variant="light" color="yellow">
                <IconCrown size={32} aria-hidden="true" />
              </ThemeIcon>
              <Title order={3} ta="center">
                {t("errors.premiumRequired.title")}
              </Title>
              <Text c="dimmed" ta="center" maw={400}>
                {t("giveaways.templates.premiumDescription")}
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
        ) : (
          <>
            <Alert
              icon={<IconInfoCircle size={16} aria-hidden="true" />}
              color="indigo"
              variant="light"
            >
              {t("giveaways.templates.infoText")}
            </Alert>

            {isLoading ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {[1, 2, 3].map((k) => (
                  <Skeleton key={k} height={160} radius="sm" />
                ))}
              </SimpleGrid>
            ) : templates.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {templates.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    template={tpl}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onLaunch={handleLaunch}
                  />
                ))}
                <Box
                  style={{
                    border: "1.5px dashed var(--mantine-color-default-border)",
                    borderRadius: 8,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    cursor: "pointer",
                    minHeight: 130,
                  }}
                  onClick={handleNew}
                >
                  <IconPlus
                    size={24}
                    style={{ opacity: 0.3 }}
                    aria-hidden="true"
                  />
                  <Text size="xs" c="dimmed" ta="center">
                    {t("giveaways.templates.createFromExisting")}
                  </Text>
                </Box>
              </SimpleGrid>
            ) : (
              <Paper withBorder p="xl">
                <Stack align="center" gap="md" py="xl">
                  <ThemeIcon
                    size={64}
                    radius="xl"
                    variant="light"
                    color="indigo"
                  >
                    <IconTemplate size={32} aria-hidden="true" />
                  </ThemeIcon>
                  <Title order={3} ta="center">
                    {t("giveaways.templates.noTemplates")}
                  </Title>
                  <Text c="dimmed" ta="center" maw={400}>
                    {t("giveaways.templates.noTemplatesDesc")}
                  </Text>
                  <Button
                    leftSection={<IconPlus size={16} aria-hidden="true" />}
                    onClick={handleNew}
                  >
                    {t("giveaways.templates.new")}
                  </Button>
                </Stack>
              </Paper>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
