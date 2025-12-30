import { createFileRoute } from "@tanstack/react-router";
import { MdxPage } from "~/components/mdx";
import { getMdxContentMeta, useMdxContent } from "~/lib/mdx-i18n";

export const Route = createFileRoute("/wiki/developer/components")({
  loader: async ({ context }) => {
    const language = context.language;
    return await getMdxContentMeta("wiki/developer/components", language);
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
  component: ComponentsPage,
});

function ComponentsPage() {
  const { frontmatter, loadedLanguage, isFallback } = Route.useLoaderData();
  const { Content, isLoading } = useMdxContent(
    "wiki/developer/components",
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
      path="/wiki/developer/components"
      isFallback={isFallback}
    >
      <Content />
    </MdxPage>
  );
}
