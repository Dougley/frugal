import { MetaArgs, Outlet, useLocation } from "react-router";
import { MdxPage } from "~/components/mdx/MdxPage";
import { getPage } from "~/utils/mdx";

export function meta({ location }: MetaArgs) {
  // Don't try to get MDX frontmatter for the index page
  if (/^\/wiki\/?$/.test(location.pathname)) {
    return [
      { title: "Wiki" },
      { description: "Documentation and guides" },
      {
        name: "og:description",
        content: "Documentation and guides",
      },
    ];
  }

  const { frontmatter } = getPage(location.pathname);
  return [
    { title: frontmatter.title },
    { description: frontmatter.description },
    {
      name: "og:description",
      content: frontmatter.description,
    },
  ];
}

export default function WikiLayout() {
  const location = useLocation();

  // Render index page without MDX wrapper
  if (/^\/wiki\/?$/.test(location.pathname)) {
    return <Outlet />;
  }

  const { frontmatter } = getPage(location.pathname);
  return (
    <MdxPage
      title={frontmatter.title}
      description={frontmatter.description}
      showToc={frontmatter.showtoc}
    >
      <Outlet />
    </MdxPage>
  );
}
