import { CategoryIndex } from "~/components/CategoryIndex/CategoryIndex";

export function meta() {
  return [
    { title: "Reference" },
    {
      description:
        "Configuration options, command references, and technical specifications",
    },
    {
      name: "og:description",
      content:
        "Configuration options, command references, and technical specifications",
    },
  ];
}

export default function ReferenceIndex() {
  return (
    <CategoryIndex
      category="reference"
      title="Reference"
      description="Quick reference documentation for commands, configuration, and specifications"
    />
  );
}
