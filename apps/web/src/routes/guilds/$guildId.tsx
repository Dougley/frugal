import {
  Avatar,
  Box,
  Button,
  Group,
  ScrollArea,
  Skeleton,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconChartBar,
  IconDiamond,
  IconGift,
  IconLayout,
  IconPlus,
  IconSettings,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "~/components/AuthContext/AuthContext";

export const Route = createFileRoute("/guilds/$guildId")({
  loader: async ({ context, params }) => {
    if (context.session) {
      await context.queryClient.ensureQueryData(
        context.trpc.giveaways.getGuildInfo.queryOptions({
          guildId: params.guildId,
        })
      );
    }
  },
  component: GuildLayout,
});

function GuildLayout() {
  const { isAuthenticated } = useAuth();
  const { trpc } = Route.useRouteContext();
  const { guildId } = Route.useParams();
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const guildInfoQuery = useQuery({
    ...trpc.giveaways.getGuildInfo.queryOptions({ guildId }),
    enabled: isAuthenticated,
  });

  const guild = guildInfoQuery.data?.guild;

  const isPremium = guildInfoQuery.data?.isPremium ?? false;

  const tabs = [
    {
      path: `/guilds/${guildId}/`,
      label: t("giveaways.dashboard.giveaways"),
      icon: <IconGift size={15} aria-hidden="true" />,
      premium: false,
    },
    {
      path: `/guilds/${guildId}/create`,
      label: t("giveaways.dashboard.newGiveaway"),
      icon: <IconPlus size={15} aria-hidden="true" />,
      premium: false,
    },
    {
      path: `/guilds/${guildId}/analytics`,
      label: t("giveaways.dashboard.analytics"),
      icon: <IconChartBar size={15} aria-hidden="true" />,
      premium: true,
    },
    {
      path: `/guilds/${guildId}/templates`,
      label: t("giveaways.dashboard.templates"),
      icon: <IconLayout size={15} aria-hidden="true" />,
      premium: true,
    },
    {
      path: `/guilds/${guildId}/settings`,
      label: t("giveaways.dashboard.settings"),
      icon: <IconSettings size={15} aria-hidden="true" />,
      premium: false,
    },
  ];

  return (
    <Box>
      <Box
        style={{
          borderBottom: "1px solid var(--mantine-color-default-border)",
          background: "var(--mantine-color-body)",
        }}
      >
        <Box px="lg" pt="sm" pb={0} maw={1200} mx="auto">
          <Button
            component={Link}
            to="/guilds"
            variant="subtle"
            size="xs"
            leftSection={<IconArrowLeft size={14} aria-hidden="true" />}
            w="fit-content"
            mb="xs"
          >
            {t("giveaways.backToGiveaways")}
          </Button>

          {isAuthenticated && (
            <Group mb="sm" gap="sm">
              {guild ? (
                <>
                  <Avatar
                    src={guild.iconUrl ?? undefined}
                    alt={guild.name}
                    size="md"
                    radius="md"
                  >
                    {guild.name.charAt(0)}
                  </Avatar>
                  <Text fw={700} size="lg">
                    {guild.name}
                  </Text>
                </>
              ) : (
                <>
                  <Skeleton height={40} width={40} radius="md" />
                  <Skeleton height={24} width={180} />
                </>
              )}
            </Group>
          )}

          <ScrollArea type="scroll" scrollbarSize={4} offsetScrollbars>
            <Group gap={2} wrap="nowrap" pb={1}>
              {tabs.map((tab) => {
                const isActive =
                  tab.path === `/guilds/${guildId}/`
                    ? pathname === tab.path ||
                      !tabs.some((t, i) => i > 0 && pathname.startsWith(t.path))
                    : pathname.startsWith(tab.path);
                const isLocked =
                  tab.premium &&
                  !isPremium &&
                  guildInfoQuery.data !== undefined;
                const btn = (
                  <Button
                    key={tab.path}
                    component={Link}
                    to={tab.path}
                    variant={isActive ? "light" : "subtle"}
                    size="sm"
                    leftSection={tab.icon}
                    rightSection={
                      isLocked ? (
                        <IconDiamond
                          size={12}
                          color="var(--mantine-color-yellow-5)"
                          aria-hidden="true"
                        />
                      ) : undefined
                    }
                    style={{
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      borderBottom: isActive
                        ? "2px solid var(--mantine-color-indigo-6)"
                        : "2px solid transparent",
                    }}
                  >
                    {tab.label}
                  </Button>
                );
                return isLocked ? (
                  <Tooltip
                    key={tab.path}
                    label={t("errors.premiumRequired.title")}
                    withArrow
                  >
                    {btn}
                  </Tooltip>
                ) : (
                  btn
                );
              })}
            </Group>
          </ScrollArea>
        </Box>
      </Box>
      <Outlet />
    </Box>
  );
}
