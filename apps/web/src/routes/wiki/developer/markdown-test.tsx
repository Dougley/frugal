import { createFileRoute } from "@tanstack/react-router";
import { MdxPage } from "~/components/mdx";
import { getMdxContentMeta, useMdxContent } from "~/lib/mdx-i18n";

export const Route = createFileRoute("/wiki/developer/markdown-test")({
  loader: async ({ context }) => {
    const language = context.language;
    return await getMdxContentMeta("wiki/developer/markdown-test", language);
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
  component: MarkdownTestPage,
});

function MarkdownTestPage() {
  const { frontmatter, loadedLanguage, isFallback } = Route.useLoaderData();
  const { Content, isLoading } = useMdxContent(
    "wiki/developer/markdown-test",
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
      path="/wiki/developer/markdown-test"
      isFallback={isFallback}
    >
      <Content />
    </MdxPage>
  );
}
