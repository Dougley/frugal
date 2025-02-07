import { Container, SimpleGrid, Stack, Title } from "@mantine/core";
import { DocumentCard } from "~/components/DocumentCard/DocumentCard";
import { getPages } from "~/utils/mdx";

export default function WikiIndex() {
  const wikiPages = getPages()
    // Only include pages that start with /wiki/ and aren't the index
    .filter(
      (page) => page.slug.startsWith("/wiki.") && page.slug !== "/wiki.index",
    )
    .map((page) => ({
      title: page.frontmatter.title,
      description: page.frontmatter.description,
      // Convert slug format (wiki.getting-started) to path format (/wiki/getting-started)
      path: `${page.slug.replace(".", "/")}`,
    }));

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Title order={1}>Documentation</Title>
        <SimpleGrid
          cols={{
            base: 1,
            sm: 2,
          }}
        >
          {wikiPages.map((page) => (
            <DocumentCard
              key={page.path}
              title={page.title}
              description={page.description}
              path={page.path}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
