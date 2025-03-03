import { MetaArgs, Outlet, useLocation } from "react-router";
import { MdxPage } from "~/components/mdx/MdxPage";
import { getPage } from "~/utils/mdx";

export function meta({ location }: MetaArgs) {
  // Don't try to get MDX frontmatter for the index page
  if (location.pathname === "/legal") {
    return [
      { title: "Legal Documents" },
      { description: "Legal documents and policies" },
      {
        name: "og:description",
        content: "Legal documents and policies",
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

export default function LegalLayout() {
  const location = useLocation();

  // Render index page without MDX wrapper
  if (/^\/legal\/?$/.test(location.pathname)) {
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
