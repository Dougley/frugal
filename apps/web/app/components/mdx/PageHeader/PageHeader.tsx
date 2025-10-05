import { Box, Button, Group, Image, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";
import type { Frontmatter } from "~/utils/mdx";
import { Breadcrumbs } from "../Breadcrumbs";
import { DocBadge } from "../DocBadge/DocBadge";
import { PageMeta } from "../PageMeta";

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Current page path for breadcrumbs */
  path?: string;
  /** Custom breadcrumb labels */
  breadcrumbLabels?: Record<string, string>;
  /** Frontmatter data */
  frontmatter?: Frontmatter;
  /** Reading time in minutes */
  readingTime?: number;
}

export function PageHeader({
  title,
  description,
  path,
  breadcrumbLabels,
  frontmatter,
  readingTime,
}: PageHeaderProps) {
  const hasHero = frontmatter?.hero !== undefined;

  // Hero-style header (splash template)
  if (hasHero && frontmatter.hero) {
    const { hero } = frontmatter;

    return (
      <Box pt="md" pb="xl" px="xl" mb="sm" style={{}}>
        {path && <Breadcrumbs path={path} labels={breadcrumbLabels} />}

        <Stack gap="xl" align="center" ta="center" py="xl">
          {hero.image && (
            <Image
              src={hero.image}
              alt={hero.title || title}
              maw={400}
              radius="md"
            />
          )}

          <Stack gap="md" align="center">
            <Title order={1} size="h1">
              {hero.title || title}
            </Title>

            {hero.tagline && (
              <Text size="xl" c="dimmed" maw={600}>
                {hero.tagline}
              </Text>
            )}

            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <Group gap="xs" justify="center">
                {frontmatter.tags.map((tag) => (
                  <DocBadge key={tag} text={tag} variant="default" />
                ))}
              </Group>
            )}
          </Stack>

          {hero.actions && hero.actions.length > 0 && (
            <Group gap="md" justify="center">
              {hero.actions.map((action) => (
                <Button
                  key={action.link}
                  component={Link}
                  to={action.link}
                  variant={action.variant || "filled"}
                  size="lg"
                >
                  {action.text}
                </Button>
              ))}
            </Group>
          )}
        </Stack>
      </Box>
    );
  }

  // Standard doc header
  return (
    <Box pt="md" mb="sm" style={{}}>
      {path && <Breadcrumbs path={path} labels={breadcrumbLabels} />}
      <Stack gap="md" mt={path ? "md" : 0}>
        <Box>
          <Title order={1}>{title}</Title>

          {frontmatter?.tags && frontmatter.tags.length > 0 && (
            <Group gap="xs" mt="xs">
              {frontmatter.tags.map((tag) => (
                <DocBadge key={tag} text={tag} variant="default" />
              ))}
            </Group>
          )}
        </Box>

        {description && (
          <Text size="lg" c="dimmed">
            {description}
          </Text>
        )}

        <PageMeta
          readingTime={readingTime}
          lastUpdated={frontmatter?.lastUpdated}
          editUrl={frontmatter?.editUrl}
        />
      </Stack>
    </Box>
  );
}
