import { CategoryIndex } from "~/components/CategoryIndex/CategoryIndex";

export function meta() {
  return [
    { title: "User Guides" },
    { description: "Step-by-step guides for using GiveawayBot features" },
    {
      name: "og:description",
      content: "Step-by-step guides for using GiveawayBot features",
    },
  ];
}

export default function UserGuidesIndex() {
  return (
    <CategoryIndex
      category="user-guides"
      title="User Guides"
      description="Step-by-step guides for using GiveawayBot features"
    />
  );
}
