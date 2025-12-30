import { Badge, Group, Text } from "@mantine/core";
import { IconClock, IconTrophy, IconUsers } from "@tabler/icons-react";
import type { Dayjs } from "dayjs";
import { memo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type GiveawayStatsProps = {
  /** Number of winners */
  winnersCount: number;
  /** Number of participants */
  participantsCount: number;
  /** End time as dayjs instance for relative time formatting */
  endTime: Dayjs;
  /** Whether the giveaway has ended */
  isEnded: boolean;
  /** Optional live badge indicator (for active giveaways) */
  showLiveBadge?: boolean;
  /** Optional additional content after the stats */
  children?: ReactNode;
};

export const GiveawayStats = memo(function GiveawayStats({
  winnersCount,
  participantsCount,
  endTime,
  isEnded,
  showLiveBadge = false,
  children,
}: GiveawayStatsProps) {
  const { t } = useTranslation();

  return (
    <Group gap="xl">
      <Group gap="xs">
        <IconTrophy size={20} style={{ opacity: 0.6 }} aria-hidden="true" />
        <Text size="sm">{t("giveaways.winner", { count: winnersCount })}</Text>
      </Group>

      <Group gap="xs">
        <IconUsers size={20} style={{ opacity: 0.6 }} aria-hidden="true" />
        <Text size="sm">
          {t("giveaways.participant", { count: participantsCount })}
          {showLiveBadge && (
            <Badge size="xs" variant="dot" color="green" ml="xs">
              {t("giveaways.details.live")}
            </Badge>
          )}
        </Text>
      </Group>

      <Group gap="xs">
        <IconClock size={20} style={{ opacity: 0.6 }} aria-hidden="true" />
        <Text size="sm">
          {isEnded
            ? t("giveaways.ended", { time: endTime.fromNow() })
            : t("giveaways.ends", { time: endTime.fromNow() })}
        </Text>
      </Group>

      {children}
    </Group>
  );
});
