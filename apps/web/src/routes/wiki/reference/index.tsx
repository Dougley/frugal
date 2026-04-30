import { Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DocumentCard } from "~/components/DocumentCard";
import { getContentList } from "~/lib/content";
import { createMeta } from "~/utils/seo";

export const Route = createFileRoute("/wiki/reference/")({
  component: ReferenceIndexPage,
  head: () => ({
    meta: createMeta({
      title: "Reference",
      description:
        "Complete command reference and configuration options for GiveawayBot.",
      url: "/wiki/reference",
    }),
  }),
});

function ReferenceIndexPage() {
  const { t } = useTranslation();
  const { language } = useRouteContext({ from: "__root__" });

  const pages = getContentList("wiki/reference", language).sort(
    (a, b) =>
      (a.frontmatter.sidebar?.order ?? 999) -
      (b.frontmatter.sidebar?.order ?? 999)
  );

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>{t("wiki.categories.reference.title")}</Title>
          <Text c="dimmed" mt="xs">
            {t("wiki.categories.reference.description")}
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
                href={`/wiki/reference/${page.slug}`}
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
