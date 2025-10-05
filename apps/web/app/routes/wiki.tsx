import { Alert, Center } from "@mantine/core";
import { IconTestPipe } from "@tabler/icons-react";
import { useState } from "react";
import { type MetaArgs, Outlet, useLocation } from "react-router";
import { MdxPage } from "~/components/mdx/MdxPage";
import { getPage } from "~/utils/mdx";

export function meta({ location }: MetaArgs) {
  // Don't try to get MDX frontmatter for index pages or category pages
  if (
    /^\/wiki\/?$/.test(location.pathname) ||
    /^\/wiki\/[^/]+\/?$/.test(location.pathname)
  ) {
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
  const [alertOpened, setAlertOpened] = useState(true);

  // Render index and category pages without MDX wrapper (they handle their own layout)
  if (
    /^\/wiki\/?$/.test(location.pathname) ||
    /^\/wiki\/[^/]+\/?$/.test(location.pathname)
  ) {
    return <Outlet />;
  }

  const { frontmatter } = getPage(location.pathname);
  return (
    <>
      <Center>
        <Alert
          hidden={alertOpened}
          withCloseButton
          onClose={() => setAlertOpened(false)}
          title="Beta Feature"
          color="yellow"
          mb="md"
          variant="outline"
          w="25vw"
          icon={<IconTestPipe />}
        >
          This wiki is a beta feature, thanks for being an early tester!
        </Alert>
      </Center>
      <MdxPage
        title={frontmatter.title}
        description={frontmatter.description}
        showToc={frontmatter.showtoc}
        path={location.pathname}
        frontmatter={frontmatter}
      >
        <Outlet />
      </MdxPage>
    </>
  );
}
