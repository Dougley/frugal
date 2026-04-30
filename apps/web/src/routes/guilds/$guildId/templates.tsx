import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Menu,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
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
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "~/components/AuthContext/AuthContext";
import { noIndexMeta } from "~/utils/seo";

export const Route = createFileRoute("/guilds/$guildId/templates")({
  head: () => ({
    meta: [{ title: "Templates | GiveawayBot" }, ...noIndexMeta],
  }),
  component: GiveawayTemplatesRoute,
});

interface Template {
  id: string;
  name: string;
  winners: number;
  duration: string;
  uses: number;
}

const MOCK_TEMPLATES: Template[] = [
  {
    id: "1",
    name: "Discord Nitro 1 Month",
    winners: 1,
    duration: "7 days",
    uses: 12,
  },
  {
    id: "2",
    name: "Steam Gift Card $25",
    winners: 2,
    duration: "3 days",
    uses: 8,
  },
  {
    id: "3",
    name: "Custom Role Giveaway",
    winners: 5,
    duration: "24 hrs",
    uses: 5,
  },
  {
    id: "4",
    name: "Community Milestone",
    winners: 10,
    duration: "48 hrs",
    uses: 3,
  },
  {
    id: "5",
    name: "Holiday Special",
    winners: 1,
    duration: "14 days",
    uses: 2,
  },
];

function TemplateCard({ template }: { template: Template }) {
  const { t } = useTranslation();

  const handleLaunch = () => {
    notifications.show({
      title: t("giveaways.templates.comingSoon"),
      message: t("giveaways.templates.comingSoonMessage"),
      color: "indigo",
    });
  };

  const handleEdit = () => {
    notifications.show({
      title: t("giveaways.templates.comingSoon"),
      message: t("giveaways.templates.comingSoonMessage"),
      color: "indigo",
    });
  };

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
                {template.duration}
              </Badge>
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
                onClick={handleEdit}
              >
                {t("giveaways.templates.edit")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={14} aria-hidden="true" />}
                color="red"
                onClick={handleEdit}
              >
                {t("common.delete")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Text size="xs" c="dimmed">
          {t("giveaways.templates.usedCount", { count: template.uses })}
        </Text>

        <Divider />

        <Group gap="sm">
          <Button
            size="xs"
            leftSection={<IconPlayerPlay size={12} aria-hidden="true" />}
            onClick={handleLaunch}
          >
            {t("giveaways.templates.launch")}
          </Button>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconEdit size={12} aria-hidden="true" />}
            onClick={handleEdit}
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
  const templates = MOCK_TEMPLATES;

  const guildInfoQuery = useQuery({
    ...trpc.giveaways.getGuildInfo.queryOptions({ guildId }),
    enabled: isAuthenticated,
  });

  const isPremium = guildInfoQuery.data?.isPremium ?? false;
  const infoReady = !guildInfoQuery.isLoading;

  const handleNew = () => {
    notifications.show({
      title: t("giveaways.templates.comingSoon"),
      message: t("giveaways.templates.comingSoonMessage"),
      color: "indigo",
    });
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Title order={1}>{t("giveaways.templates.title")}</Title>
            <Text c="dimmed">{t("giveaways.templates.subtitle")}</Text>
          </Stack>
          <Button
            leftSection={<IconPlus size={16} aria-hidden="true" />}
            onClick={handleNew}
          >
            {t("giveaways.templates.new")}
          </Button>
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

            {templates.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {templates.map((tpl) => (
                  <TemplateCard key={tpl.id} template={tpl} />
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
