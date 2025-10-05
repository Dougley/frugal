import { Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { DocumentCard } from "~/components/DocumentCard/DocumentCard";
import { getPages } from "~/utils/mdx";

interface CategoryIndexProps {
  category: string;
  title: string;
  description: string;
}

export function CategoryIndex({
  category,
  title,
  description,
}: CategoryIndexProps) {
  const categoryPages = getPages()
    .filter((page) => {
      const slug = page.slug;
      return slug.startsWith(`/wiki.${category}.`) && !slug.endsWith(".index");
    })
    .map((page) => ({
      title: page.frontmatter.title,
      description: page.frontmatter.description,
      path: page.slug.replace(/\./g, "/"),
      order: page.frontmatter.sidebar?.order ?? 999,
    }))
    .sort((a, b) => a.order - b.order);

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>{title}</Title>
          <Text c="dimmed" mt="xs">
            {description}
          </Text>
        </div>
        {categoryPages.length > 0 ? (
          <SimpleGrid
            cols={{
              base: 1,
              sm: 2,
            }}
          >
            {categoryPages.map((page) => (
              <DocumentCard
                key={page.path}
                title={page.title}
                description={page.description}
                path={page.path}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Text c="dimmed">No pages in this category yet.</Text>
        )}
      </Stack>
    </Container>
  );
}
