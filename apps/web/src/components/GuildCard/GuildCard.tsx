import { Anchor, Avatar, Badge, Group, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { HoverCard } from "~/components/HoverCard";

export interface GuildData {
  id: string;
  name: string;
  icon: string | null;
  iconUrl: string | null;
  giveawayCount?: number;
  activeCount?: number;
}

export interface GuildCardProps {
  guild: GuildData;
}

export const GuildCard = memo(function GuildCard({ guild }: GuildCardProps) {
  const { t } = useTranslation();

  return (
    <Anchor component={Link} to={`/giveaways/${guild.id}`} underline="never">
      <HoverCard style={{ cursor: "pointer" }}>
        <Group justify="space-between">
          <Group>
            <Avatar
              src={guild.iconUrl ?? undefined}
              alt={guild.name}
              radius="md"
            >
              {guild.name.charAt(0)}
            </Avatar>
            <div>
              <Text size="lg" fw={500}>
                {guild.name}
              </Text>
              {guild.giveawayCount !== undefined && (
                <Text size="xs" c="dimmed">
                  {t("giveaways.giveaway", { count: guild.giveawayCount })}
                </Text>
              )}
            </div>
          </Group>
          {guild.activeCount !== undefined && guild.activeCount > 0 && (
            <Badge size="sm" variant="light" color="green">
              {guild.activeCount} {t("giveaways.status.active").toLowerCase()}
            </Badge>
          )}
        </Group>
      </HoverCard>
    </Anchor>
  );
});
