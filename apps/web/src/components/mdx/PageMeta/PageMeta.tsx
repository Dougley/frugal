import { Anchor, Grid, Group, Text, Tooltip } from "@mantine/core";
import { IconCalendar, IconClock, IconEdit } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedDayjs } from "~/lib/dayjs";
import styles from "./PageMeta.module.css";

interface PageMetaProps {
  /** Reading time in minutes */
  readingTime?: number;
  /** Last updated date (YYYY-MM-DD or ISO string) */
  lastUpdated?: string | false;
  /** Edit page URL */
  editUrl?: string | false;
  /** Children for custom metadata items */
  children?: ReactNode;
}

export function PageMeta({
  readingTime,
  lastUpdated,
  editUrl,
  children,
}: PageMetaProps) {
  const { t } = useTranslation();
  const dayjs = useLocalizedDayjs();
  const hasMetadata =
    readingTime !== undefined || lastUpdated !== false || editUrl !== false;

  if (!hasMetadata && !children) {
    return null;
  }

  return (
    <Grid
      mb="md"
      gutter={{
        base: "xs",
        sm: "lg",
      }}
    >
      {readingTime && (
        <Grid.Col span={{ base: 12, md: "content" }}>
          <Group gap="xs" wrap="nowrap">
            <IconClock size={16} className={styles.icon} aria-hidden="true" />
            <Text size="sm" c="dimmed">
              {t("wiki.minRead", { count: readingTime })}
            </Text>
          </Group>
        </Grid.Col>
      )}

      {lastUpdated && (
        <Grid.Col span={{ base: 12, md: "content" }}>
          <Tooltip label={dayjs(lastUpdated).format("MMMM D, YYYY")} withArrow>
            <Group gap="xs" wrap="nowrap">
              <IconCalendar
                size={16}
                className={styles.icon}
                aria-hidden="true"
              />
              <Text size="sm" c="dimmed">
                {t("wiki.updated", { time: dayjs(lastUpdated).fromNow() })}
              </Text>
            </Group>
          </Tooltip>
        </Grid.Col>
      )}

      {editUrl && (
        <Grid.Col span={{ base: 12, md: "content" }}>
          <Anchor
            href={editUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            c="dimmed"
          >
            <Group gap="xs" wrap="nowrap">
              <IconEdit size={16} aria-hidden="true" />
              <Text size="sm">{t("wiki.suggestEdits")}</Text>
            </Group>
          </Anchor>
        </Grid.Col>
      )}

      {children}
    </Grid>
  );
}
