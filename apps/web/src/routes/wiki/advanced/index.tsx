import { Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DocumentCard } from "~/components/DocumentCard";
import { getContentList } from "~/lib/content";
import { createMeta } from "~/utils/seo";

export const Route = createFileRoute("/wiki/advanced/")({
  component: AdvancedIndexPage,
  head: () => ({
    meta: createMeta({
      title: "Advanced Topics",
      description: "In-depth guides and advanced features for power users.",
      url: "/wiki/advanced",
    }),
  }),
});

function AdvancedIndexPage() {
  const { t } = useTranslation();
  const { language } = useRouteContext({ from: "__root__" });

  const pages = getContentList("wiki/advanced", language).sort(
    (a, b) =>
      (a.frontmatter.sidebar?.order ?? 999) -
      (b.frontmatter.sidebar?.order ?? 999)
  );

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>{t("wiki.categories.advanced.title")}</Title>
          <Text c="dimmed" mt="xs">
            {t("wiki.categories.advanced.description")}
          </Text>
        </div>
        {pages.length > 0 ? (
          <SimpleGrid
            cols={{
              base: 1,
              sm: 2,
            }}
          >
            {pages.map((page) => (
              <DocumentCard
                key={page.slug}
                title={page.frontmatter.title}
                description={page.frontmatter.description}
                href={`/wiki/advanced/${page.slug}`}
                isTranslated={page.isTranslated}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Text c="dimmed">{t("wiki.noPagesYet")}</Text>
        )}
      </Stack>
    </Container>
  );
}
