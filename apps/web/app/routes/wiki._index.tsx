import { Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import {
  IconChartBar,
  IconCode,
  IconRocket,
  IconTerminal,
  IconUsers,
} from "@tabler/icons-react";
import { DocumentCard } from "~/components/DocumentCard/DocumentCard";

const categories = [
  {
    title: "Getting Started",
    description:
      "Quick start guides and tutorials to get you up and running with GiveawayBot",
    path: "/wiki/getting-started",
    icon: IconRocket,
  },
  {
    title: "User Guides",
    description: "Step-by-step guides for using GiveawayBot features",
    path: "/wiki/user-guides",
    icon: IconUsers,
  },
  {
    title: "Developer Documentation",
    description: "API references, integration guides, and developer resources",
    path: "/wiki/developer",
    icon: IconCode,
  },
  {
    title: "Advanced Topics",
    description: "In-depth guides and advanced features for power users",
    path: "/wiki/advanced",
    icon: IconChartBar,
  },
  {
    title: "Reference",
    description:
      "Configuration options, command references, and technical specifications",
    path: "/wiki/reference",
    icon: IconTerminal,
  },
];

export default function WikiIndex() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1}>Documentation</Title>
          <Text c="dimmed" mt="xs">
            Everything you need to know about GiveawayBot
          </Text>
        </div>
        <SimpleGrid
          cols={{
            base: 1,
            sm: 2,
          }}
        >
          {categories.map((category) => (
            <DocumentCard
              key={category.path}
              title={category.title}
              description={category.description}
              path={category.path}
              icon={<category.icon size={24} />}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
