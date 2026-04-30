import { Anchor, Box, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight, IconExternalLink } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import styles from "./LinkCard.module.css";

interface LinkCardProps {
  href: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  external?: boolean;
}

export function LinkCard({
  href,
  title,
  description,
  icon,
  external = false,
}: LinkCardProps) {
  const isExternal = external || href.startsWith("http");

  const CardContent = (
    <Card
      padding="lg"
      radius="md"
      withBorder
      h="100%"
      className={styles.card}
      __vars={{
        "--card-hover-transform": "translateY(-2px)",
      }}
      styles={{
        root: {
          "&:hover": {
            transform: "var(--card-hover-transform)",
            boxShadow: "var(--mantine-shadow-md)",
          },
        },
      }}
    >
      <Stack gap="sm" h="100%">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Group
            gap="sm"
            wrap="nowrap"
            align="flex-start"
            className={styles.titleWrapper}
          >
            {icon && (
              <Box c="blue.6" className={styles.iconContainer}>
                {icon}
              </Box>
            )}
            <Title order={3} size="h4" className={styles.titleHeading}>
              {title}
            </Title>
          </Group>
          <Box c="blue.6" className={styles.arrowIcon}>
            {isExternal ? (
              <IconExternalLink size={20} aria-hidden="true" />
            ) : (
              <IconArrowRight size={20} aria-hidden="true" />
            )}
          </Box>
        </Group>
        {description && (
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        )}
      </Stack>
    </Card>
  );

  if (isExternal) {
    return (
      <Anchor
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        underline="never"
        c="inherit"
      >
        {CardContent}
      </Anchor>
    );
  }

  return (
    <Anchor component={Link} to={href} underline="never" c="inherit">
      {CardContent}
    </Anchor>
  );
}
