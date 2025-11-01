import { Anchor, Grid, Group, Text, Tooltip } from "@mantine/core";
import { IconCalendar, IconClock, IconEdit } from "@tabler/icons-react";
import { formatDate, formatDistanceToNow } from "date-fns";
import type { ReactNode } from "react";
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
            <IconClock size={16} className={styles.icon} />
            <Text size="sm" c="dimmed">
              {readingTime} min read
            </Text>
          </Group>
        </Grid.Col>
      )}

      {lastUpdated && (
        <Grid.Col span={{ base: 12, md: "content" }}>
          <Tooltip label={formatDate(lastUpdated, "PPP")} withArrow>
            <Group gap="xs" wrap="nowrap">
              <IconCalendar size={16} className={styles.icon} />
              <Text size="sm" c="dimmed">
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
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
              <IconEdit size={16} />
              <Text size="sm">Suggest edits</Text>
            </Group>
          </Anchor>
        </Grid.Col>
      )}

      {children}
    </Grid>
  );
}

function _formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateStr;
  }
}
