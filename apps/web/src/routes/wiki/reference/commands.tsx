import { createFileRoute } from "@tanstack/react-router";
import { MdxPage } from "~/components/mdx";
import { getMdxContentMeta, useMdxContent } from "~/lib/mdx-i18n";

export const Route = createFileRoute("/wiki/reference/commands")({
  loader: async ({ context }) => {
    const language = context.language;
    return await getMdxContentMeta("wiki/reference/commands", language);
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
  component: CommandsPage,
});

function CommandsPage() {
  const { frontmatter, loadedLanguage, isFallback } = Route.useLoaderData();
  const { Content, isLoading } = useMdxContent(
    "wiki/reference/commands",
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
      path="/wiki/reference/commands"
      isFallback={isFallback}
    >
      <Content />
    </MdxPage>
  );
}
