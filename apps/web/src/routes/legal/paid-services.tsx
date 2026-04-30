import { createFileRoute } from "@tanstack/react-router";
import { MdxPage } from "~/components/mdx";
import { getMdxContentMeta, useMdxContent } from "~/lib/mdx-i18n";

export const Route = createFileRoute("/legal/paid-services")({
  loader: async ({ context }) => {
    const language = context.language;
    return await getMdxContentMeta("legal/paid-services", language);
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.frontmatter.title} | GiveawayBot` },
      { name: "description", content: loaderData?.frontmatter.description },
      { property: "og:title", content: loaderData?.frontmatter.title },
      {
        property: "og:description",
        content: loaderData?.frontmatter.description,
      },
    ],
  }),
  component: PaidServicesPage,
});

function PaidServicesPage() {
  const { frontmatter, loadedLanguage, isFallback } = Route.useLoaderData();
  const { Content, isLoading } = useMdxContent(
    "legal/paid-services",
    loadedLanguage
  );

  if (isLoading || !Content) {
    return null;
  }

  return (
    <MdxPage
      title={frontmatter.title}
      description={frontmatter.description}
      frontmatter={frontmatter}
      path="/legal/paid-services"
      isFallback={isFallback}
    >
      <Content />
    </MdxPage>
  );
}
