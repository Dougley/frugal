import { Container, SimpleGrid, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { DocumentCard } from "~/components/DocumentCard";
import { getContentList } from "~/lib/content";

export const Route = createFileRoute("/legal/")({
  component: LegalIndexPage,
  head: () => ({
    meta: [
      { title: "Legal Documents | GiveawayBot" },
      { name: "description", content: "Legal documents and policies" },
      { property: "og:title", content: "Legal Documents" },
      { property: "og:description", content: "Legal documents and policies" },
    ],
  }),
});

function LegalIndexPage() {
  const legalPages = getContentList("legal");

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Title order={1}>Legal Documents</Title>
        <SimpleGrid
          cols={{
            base: 1,
            sm: 2,
          }}
        >
          {legalPages.map((page) => (
            <DocumentCard
              key={page.slug}
              title={page.frontmatter.title}
              description={page.frontmatter.description}
              href={`/legal/${page.slug}`}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
