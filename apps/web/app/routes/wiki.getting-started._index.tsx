import { CategoryIndex } from "~/components/CategoryIndex/CategoryIndex";

export function meta() {
  return [
    { title: "Getting Started" },
    {
      description:
        "Quick start guides and tutorials to get you up and running with GiveawayBot",
    },
    {
      name: "og:description",
      content:
        "Quick start guides and tutorials to get you up and running with GiveawayBot",
    },
  ];
}

export default function GettingStartedIndex() {
  return (
    <CategoryIndex
      category="getting-started"
      title="Getting Started"
      description="Quick start guides and tutorials to get you up and running with GiveawayBot"
    />
  );
}
