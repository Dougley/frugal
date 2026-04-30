import {
  Button,
  Container,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconFileUnknown } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function WikiNotFound() {
  const { t } = useTranslation();

  return (
    <Container component="main" size="sm" py="xl">
      <Stack align="center" gap="lg">
        <ThemeIcon size={80} radius="xl" variant="light" color="yellow">
          <IconFileUnknown size={48} aria-hidden="true" />
        </ThemeIcon>

        <Stack align="center" gap="xs">
          <Title order={1} size="h2" ta="center">
            {t("wiki.notFound.title")}
          </Title>
          <Text c="dimmed" ta="center" maw={400}>
            {t("wiki.notFound.message")}
          </Text>
        </Stack>

        <Group>
          <Button
            component={Link}
            to="/wiki"
            leftSection={<IconArrowLeft size={16} aria-hidden="true" />}
            variant="light"
          >
            {t("wiki.notFound.backToWiki")}
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
