import { createFileRoute } from "@tanstack/react-router";
import { MdxPage } from "~/components/mdx";
import { getMdxContentMeta, useMdxContent } from "~/lib/mdx-i18n";

export const Route = createFileRoute("/wiki/getting-started/quick-start")({
  loader: async ({ context }) => {
    const language = context.language;
    return await getMdxContentMeta(
      "wiki/getting-started/quick-start",
      language
    );
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.frontmatter.title} | Frugal Wiki` },
      { name: "description", content: loaderData?.frontmatter.description },
      { property: "og:title", content: loaderData?.frontmatter.title },
      {
        property: "og:description",
        content: loaderData?.frontmatter.description,
      },
    ],
  }),
  component: QuickStartPage,
});

function QuickStartPage() {
  const { frontmatter, loadedLanguage, isFallback } = Route.useLoaderData();
  const { Content, isLoading } = useMdxContent(
    "wiki/getting-started/quick-start",
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
      showToc={frontmatter.showtoc}
      path="/wiki/getting-started/quick-start"
      isFallback={isFallback}
    >
      <Content />
    </MdxPage>
  );
}
