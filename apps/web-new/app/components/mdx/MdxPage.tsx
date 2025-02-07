import {
  Affix,
  Button,
  Container,
  Divider,
  Flex,
  Text,
  Title,
  Transition,
  TypographyStylesProvider,
} from "@mantine/core";
import { useWindowScroll } from "@mantine/hooks";
import { MDXProvider } from "@mdx-js/react";
import { IconArrowUp } from "@tabler/icons-react";
import { useMDXComponents } from "mdx-components";
import { ReactNode } from "react";
import { TableOfContentsNav } from "~/components/mdx/TableOfContents/TableOfContents";

interface MdxPageProps {
  title: string;
  description?: string;
  showToc?: boolean;
  children: ReactNode;
}

export function MdxPage({
  title,
  description,
  showToc = false,
  children,
}: MdxPageProps) {
  const [scroll, scrollTo] = useWindowScroll();

  return (
    <Flex
      gap="sm"
      justify="flex-start"
      align="flex-start"
      direction="row"
      wrap="wrap"
    >
      <Container size="md">
        <Title order={1}>{title}</Title>
        {description && <Text c="dimmed">{description}</Text>}
        <Divider my="lg" />
        <div id="mdx">
          <TypographyStylesProvider>
            <MDXProvider components={useMDXComponents({})}>
              {children}
            </MDXProvider>
          </TypographyStylesProvider>
        </div>
        <Affix position={{ bottom: 20, right: 20 }}>
          <Transition transition="slide-up" mounted={scroll.y > 0}>
            {(transitionStyles) => (
              <Button
                leftSection={<IconArrowUp size={16} />}
                style={transitionStyles}
                onClick={() => scrollTo({ y: 0 })}
              >
                Scroll to top
              </Button>
            )}
          </Transition>
        </Affix>
      </Container>
      {showToc && <TableOfContentsNav />}
    </Flex>
  );
}
