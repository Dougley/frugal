import { Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { Link } from "react-router";
import styles from "./DocumentCard.module.css";

interface DocumentCardProps {
  title: string;
  description: string;
  path: string;
  icon?: React.ReactNode;
}

export function DocumentCard({
  title,
  description,
  path,
  icon,
}: DocumentCardProps) {
  return (
    <Card
      component={Link}
      to={path}
      className={styles.card}
      padding="lg"
      radius="md"
      withBorder
    >
      <Stack gap="sm">
        <Group gap="sm">
          {icon && <div>{icon}</div>}
          <Title order={2} size="h3">
            {title}
          </Title>
        </Group>
        <Text c="dimmed">{description}</Text>
        <Group gap={4} className={styles.readMore} c="blue">
          <Text>Read more</Text>
          <IconArrowRight size={16} />
        </Group>
      </Stack>
    </Card>
  );
}
