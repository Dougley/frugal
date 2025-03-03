import type { MetaDescriptor } from "react-router";

export const defaultMeta = (
  titleSuffix?: string,
  description?: string,
): MetaDescriptor[] => {
  return [
    { property: "og:site_name", content: "GiveawayBot" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: "GiveawayBot" },
    {
      property: "og:description",
      content: "Hold giveaways on your Discord server quickly and easily",
    },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@GiveawayBot" },
    { name: "twitter:title", content: "GiveawayBot" },
    {
      name: "twitter:description",
      content: "Hold giveaways on your Discord server quickly and easily",
    },
    { title: `GiveawayBot${titleSuffix ? ` - ${titleSuffix}` : ""}` },
    { name: "description", content: description ?? "GiveawayBot" },
  ];
};
