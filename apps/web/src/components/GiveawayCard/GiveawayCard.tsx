import {
  ActionIcon,
  Box,
  Group,
  Menu,
  Skeleton,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconChevronRight,
  IconClock,
  IconCopy,
  IconDotsVertical,
  IconEdit,
  IconExternalLink,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { useTranslation } from "react-i18next";

import { HoverCard, hoverCardStyles } from "~/components/HoverCard";
import { useLocalizedDayjs } from "~/lib/dayjs";
import styles from "./GiveawayCard.module.css";

/**
 * Giveaway data shape used by the card component
 */
export interface GiveawayData {
  messageId: string;
  prize: string;
  state: string;
  endTime: string;
  durableObjectId: string;
  channelId: string;
  winners: number;
  description?: string | null;
}

export interface GiveawayCardProps {
  /** Giveaway data to display */
  giveaway: GiveawayData;
  /** Guild ID for constructing Discord URLs */
  guildId: string;
  /** Callback when edit action is triggered */
  onEdit: (giveaway: GiveawayData) => void;
  /** Callback when stop action is triggered */
  onStop: (giveaway: GiveawayData) => void;
  /** Callback when reroll action is triggered */
  onReroll: (giveaway: GiveawayData) => void;
}

/**
 * Giveaway card component with hover effects and action menu
 *
 * Displays a giveaway with accessible stretched link pattern:
 * - Card has position: relative
 * - Prize title is a Link with ::after pseudo-element covering the entire card
 * - Menu button has position: relative + z-index to sit above the stretched link
 * - Preserves all accessibility: keyboard nav, right-click, screen readers
 *
 * @example
 * ```tsx
 * <GiveawayCard
 *   giveaway={giveaway}
 *   guildId={guildId}
 *   onEdit={handleEdit}
 *   onStop={handleStop}
 *   onReroll={handleReroll}
 * />
 * ```
 */
export const GiveawayCard = memo(function GiveawayCard({
  giveaway,
  guildId,
  onEdit,
  onStop,
  onReroll,
}: GiveawayCardProps) {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const dayjs = useLocalizedDayjs();
  const isClosed = giveaway.state === "CLOSED";

  const discordUrl = `https://discord.com/channels/${guildId}/${giveaway.channelId}/${giveaway.messageId}`;
  const summaryUrl = `/giveaways/summaries/${giveaway.durableObjectId}`;
  const detailsUrl = `/giveaways/details/${giveaway.durableObjectId}`;

  return (
    <HoverCard
      style={{
        position: "relative",
        opacity: isClosed ? 0.75 : 1,
        borderColor: isClosed ? undefined : theme.colors.green[6],
        borderWidth: isClosed ? 1 : 2,
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text
            component={Link}
            to={isClosed ? summaryUrl : detailsUrl}
            size="lg"
            fw={500}
            className={`${styles.stretchedLink} ${hoverCardStyles.linkText}`}
            lineClamp={2}
          >
            {giveaway.prize}
          </Text>

          <Box className={hoverCardStyles.aboveStretchedLink}>
            <Menu shadow="md" width={180} position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  size={32}
                  aria-label={t("giveaways.menu.actions")}
                >
                  <IconDotsVertical size={20} aria-hidden="true" />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{t("giveaways.menu.actions")}</Menu.Label>
                {!isClosed && (
                  <>
                    <Menu.Item
                      leftSection={<IconEdit size={16} aria-hidden="true" />}
                      onClick={() => onEdit(giveaway)}
                    >
                      {t("giveaways.menu.edit")}
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconClock size={16} aria-hidden="true" />}
                      color="red"
                      onClick={() => onStop(giveaway)}
                    >
                      {t("giveaways.menu.stopEarly")}
                    </Menu.Item>
                  </>
                )}
                {isClosed && (
                  <Menu.Item
                    leftSection={
                      <IconPlayerPlay size={16} aria-hidden="true" />
                    }
                    onClick={() => onReroll(giveaway)}
                  >
                    {t("giveaways.menu.reroll")}
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Item
                  leftSection={
                    <IconExternalLink size={16} aria-hidden="true" />
                  }
                  component="a"
                  href={discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("giveaways.openInDiscord")}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconCopy size={16} aria-hidden="true" />}
                  onClick={() => {
                    navigator.clipboard.writeText(giveaway.durableObjectId);
                    notifications.show({
                      title: t("notifications.copied.title"),
                      message: t("notifications.copied.message"),
                      icon: <IconCheck size={16} aria-hidden="true" />,
                      color: "green",
                      autoClose: 2000,
                    });
                  }}
                >
                  {t("giveaways.copyId")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Box>
        </Group>

        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <IconClock size={14} style={{ opacity: 0.6 }} aria-hidden="true" />
            <Text size="sm" c="dimmed">
              {isClosed
                ? t("giveaways.ended", {
                    time: dayjs(giveaway.endTime).fromNow(),
                  })
                : t("giveaways.ends", {
                    time: dayjs(giveaway.endTime).fromNow(),
                  })}
            </Text>
          </Group>

          <Text
            component={Link}
            to={isClosed ? summaryUrl : detailsUrl}
            size="xs"
            c="dimmed"
            className={hoverCardStyles.viewDetailsLink}
          >
            {isClosed ? t("giveaways.viewSummary") : t("giveaways.viewDetails")}
            <IconChevronRight size={14} aria-hidden="true" />
          </Text>
        </Group>
      </Stack>
    </HoverCard>
  );
});

export function GiveawayCardSkeleton() {
  return (
    <HoverCard>
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <Skeleton height={24} width="70%" />
          <Skeleton height={32} width={32} radius="sm" />
        </Group>
        <Skeleton height={16} width="50%" />
      </Stack>
    </HoverCard>
  );
}
