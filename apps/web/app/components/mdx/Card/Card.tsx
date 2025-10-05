import { Box, Group, Card as MantineCard, Stack, Title } from "@mantine/core";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

interface CardProps extends ComponentPropsWithoutRef<"div"> {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function Card({ title, icon, children, ...props }: CardProps) {
  return (
    <MantineCard padding="lg" radius="md" withBorder h="100%" {...props}>
      <Stack gap="md" h="100%">
        {(title || icon) && (
          <Group gap="sm" wrap="nowrap" align="flex-start">
            {icon && (
              <Box c="blue.6" style={{ flexShrink: 0 }}>
                {icon}
              </Box>
            )}
            {title && (
              <Title order={3} size="h4" style={{ marginTop: 0 }}>
                {title}
              </Title>
            )}
          </Group>
        )}
        <Box style={{ flex: 1 }}>{children}</Box>
      </Stack>
    </MantineCard>
  );
}
