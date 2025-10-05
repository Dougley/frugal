import { CategoryIndex } from "~/components/CategoryIndex/CategoryIndex";

export function meta() {
  return [
    { title: "Advanced Topics" },
    { description: "In-depth guides and advanced features for power users" },
    {
      name: "og:description",
      content: "In-depth guides and advanced features for power users",
    },
  ];
}

export default function AdvancedIndex() {
  return (
    <CategoryIndex
      category="advanced"
      title="Advanced Topics"
      description="Dive deep into advanced features and configurations for experienced users"
    />
  );
}
