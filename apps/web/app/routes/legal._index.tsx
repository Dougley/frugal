import { Container, SimpleGrid, Stack, Title } from "@mantine/core";
import { DocumentCard } from "~/components/DocumentCard/DocumentCard";
import { getPages } from "~/utils/mdx";

export default function LegalIndex() {
  const legalPages = getPages()
    // Only include pages that start with /legal/ and aren't the index
    .filter(
      (page) => page.slug.startsWith("/legal.") && page.slug !== "/legal.index",
    )
    .map((page) => ({
      title: page.frontmatter.title,
      description: page.frontmatter.description,
      path: `${page.slug.replace(".", "/")}`,
    }));

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
