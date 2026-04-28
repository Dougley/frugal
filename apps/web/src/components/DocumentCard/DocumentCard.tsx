import { Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight, IconLanguage } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import styles from "./DocumentCard.module.css";

interface DocumentCardProps {
  title: string;
  description: string;
  href: string;
  icon?: ReactNode;
  /** Whether this content is translated in the current language */
  isTranslated?: boolean;
}

export function DocumentCard({
  title,
  description,
  href,
  icon,
  isTranslated = true,
}: DocumentCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      component={Link}
      to={href}
      className={styles.card}
      padding="lg"
      radius="md"
      withBorder
    >
      <Stack gap="sm">
        <Group gap="sm" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            {icon && <div>{icon}</div>}
            <Title order={2} size="h3">
              {title}
            </Title>
          </Group>
          {!isTranslated && (
            <Badge
              color="yellow"
              variant="light"
              size="sm"
              leftSection={<IconLanguage size={12} aria-hidden="true" />}
            >
              {t("wiki.untranslated")}
            </Badge>
          )}
        </Group>
        <Text c="dimmed">{description}</Text>
        <Group gap={4} className={styles.readMore} c="indigo">
          <Text>Read more</Text>
          <IconArrowRight size={16} aria-hidden="true" />
        </Group>
      </Stack>
    </Card>
  );
}
