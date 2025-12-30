import {
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconBook,
  IconCode,
  IconRocket,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { createMeta } from "~/utils/seo";

export const Route = createFileRoute("/wiki/")({
  component: WikiIndexPage,
  head: () => ({
    meta: createMeta({
      title: "Documentation",
      description:
        "Learn how to use GiveawayBot with guides, tutorials, and reference documentation.",
      url: "/wiki",
    }),
  }),
});

interface CategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

function CategoryCard({
  title,
  description,
  icon,
  href,
  color,
}: CategoryCardProps) {
  return (
    <Paper
      component={Link}
      to={href}
      p="xl"
      radius="md"
      withBorder
      style={{
        textDecoration: "none",
        transition: "all 0.2s ease",
      }}
      styles={{
        root: {
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
        },
      }}
    >
      <Group wrap="nowrap" align="flex-start">
        <ThemeIcon size={48} radius="md" color={color} variant="light">
          {icon}
        </ThemeIcon>
        <div>
          <Text size="lg" fw={600} mb={4}>
            {title}
          </Text>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </div>
      </Group>
    </Paper>
  );
}

function WikiIndexPage() {
  const { t } = useTranslation();

  const categories = [
    {
      titleKey: "wiki.categories.gettingStarted.title" as const,
      descriptionKey: "wiki.categories.gettingStarted.description" as const,
      icon: <IconRocket size={24} />,
      href: "/wiki/getting-started",
      color: "green",
    },
    {
      titleKey: "wiki.categories.userGuides.title" as const,
      descriptionKey: "wiki.categories.userGuides.description" as const,
      icon: <IconUsers size={24} />,
      href: "/wiki/user-guides",
      color: "blue",
    },
    {
      titleKey: "wiki.categories.reference.title" as const,
      descriptionKey: "wiki.categories.reference.description" as const,
      icon: <IconBook size={24} />,
      href: "/wiki/reference",
      color: "violet",
    },
    {
      titleKey: "wiki.categories.advanced.title" as const,
      descriptionKey: "wiki.categories.advanced.description" as const,
      icon: <IconSettings size={24} />,
      href: "/wiki/advanced",
      color: "orange",
    },
    {
      titleKey: "wiki.categories.developer.title" as const,
      descriptionKey: "wiki.categories.developer.description" as const,
      icon: <IconCode size={24} />,
      href: "/wiki/developer",
      color: "grape",
    },
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>{t("wiki.title")}</Title>
          <Text c="dimmed" mt="xs" size="lg">
            {t("wiki.subtitle")}
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {categories.map((category) => (
            <CategoryCard
              key={category.href}
              title={t(category.titleKey)}
              description={t(category.descriptionKey)}
              icon={category.icon}
              href={category.href}
              color={category.color}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
