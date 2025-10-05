import { Anchor, Box, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight, IconExternalLink } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

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
      style={{
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
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
          <Group gap="sm" wrap="nowrap" align="flex-start" style={{ flex: 1 }}>
            {icon && (
              <Box c="blue.6" style={{ flexShrink: 0 }}>
                {icon}
              </Box>
            )}
            <Title order={3} size="h4" style={{ marginTop: 0 }}>
              {title}
            </Title>
          </Group>
          <Box
            c="blue.6"
            style={{
              flexShrink: 0,
              transition: "transform 0.2s ease",
            }}
          >
            {isExternal ? (
              <IconExternalLink size={20} />
            ) : (
              <IconArrowRight size={20} />
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
