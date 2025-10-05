import { CategoryIndex } from "~/components/CategoryIndex/CategoryIndex";

export function meta() {
  return [
    { title: "Developer Documentation" },
    {
      description:
        "API references, integration guides, and developer resources",
    },
    {
      name: "og:description",
      content: "API references, integration guides, and developer resources",
    },
  ];
}

export default function DeveloperIndex() {
  return (
    <CategoryIndex
      category="developer"
      title="Developer Documentation"
      description="API references, integration guides, and developer resources"
    />
  );
}
