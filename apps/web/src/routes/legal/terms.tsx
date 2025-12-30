import { createFileRoute } from "@tanstack/react-router";
import { MdxPage } from "~/components/mdx";
import { getMdxContentMeta, useMdxContent } from "~/lib/mdx-i18n";

export const Route = createFileRoute("/legal/terms")({
  loader: async ({ context }) => {
    const language = context.language;
    return await getMdxContentMeta("legal/terms", language);
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
  component: TermsPage,
});

function TermsPage() {
  const { frontmatter, loadedLanguage, isFallback } = Route.useLoaderData();
  const { Content, isLoading } = useMdxContent("legal/terms", loadedLanguage);

  if (isLoading || !Content) {
    return null;
  }

  return (
    <MdxPage
      title={frontmatter.title}
      description={frontmatter.description}
      frontmatter={frontmatter}
      showToc={frontmatter.showtoc}
      path="/legal/terms"
      isFallback={isFallback}
    >
      <Content />
    </MdxPage>
  );
}
