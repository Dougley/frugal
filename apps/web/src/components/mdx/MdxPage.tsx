import {
  Affix,
  Alert,
  Button,
  Container,
  Divider,
  Grid,
  Transition,
  Typography,
} from "@mantine/core";
import { useId, useWindowScroll } from "@mantine/hooks";
import { IconArrowUp, IconLanguage } from "@tabler/icons-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TableOfContentsDesktop,
  TableOfContentsMobile,
} from "~/components/mdx/TableOfContents/TableOfContents";
import type { Frontmatter } from "~/utils/mdx";
import { MdxProvider } from "./MdxProvider";
import { PageHeader } from "./PageHeader/PageHeader";

interface MdxPageProps {
  title: string;
  description?: string;
  showToc?: boolean;
  children: ReactNode;
  /** Current page path for breadcrumbs */
  path?: string;
  /** Custom breadcrumb labels */
  breadcrumbLabels?: Record<string, string>;
  /** Frontmatter data */
  frontmatter?: Frontmatter;
  /** Whether the content is a fallback (translation not available) */
  isFallback?: boolean;
}

function calculateReadingTime(element: HTMLElement): number {
  const wordsPerMinute = 200;
  const text = element.textContent || "";
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function MdxPage({
  title,
  description,
  showToc = false,
  children,
  path,
  breadcrumbLabels,
  frontmatter,
  isFallback = false,
}: MdxPageProps) {
  const { t } = useTranslation();
  const [scroll, scrollTo] = useWindowScroll();
  const [readingTime, setReadingTime] = useState<number | undefined>(
    frontmatter?.readingTime
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const mdxContentId = useId("mdx");
  useEffect(() => {
    // Calculate reading time after content is rendered, if not provided in frontmatter
    if (!frontmatter?.readingTime && contentRef.current) {
      const time = calculateReadingTime(contentRef.current);
      setReadingTime(time);
    }
  }, [frontmatter?.readingTime]);

  return (
    <>
      <Container size="lg" px={{ base: "md", xl: "xl" }}>
        <PageHeader
          title={title}
          description={description}
          path={path}
          breadcrumbLabels={breadcrumbLabels}
          frontmatter={frontmatter}
          readingTime={readingTime}
        />
        <Divider mb="xl" />

        {isFallback && (
          <Alert
            icon={<IconLanguage size={20} aria-hidden="true" />}
            color="yellow"
            variant="light"
            mb="xl"
          >
            {t("mdx.translationNotAvailable")}
          </Alert>
        )}

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, xl: showToc ? 9 : 12 }}>
            <div id={mdxContentId} ref={contentRef}>
              <Typography>
                <MdxProvider>{children}</MdxProvider>
              </Typography>
            </div>
            <Affix position={{ bottom: 20, right: 20 }}>
              <Transition transition="slide-up" mounted={scroll.y > 0}>
                {(transitionStyles) => (
                  <Button
                    leftSection={<IconArrowUp size={16} aria-hidden="true" />}
                    style={transitionStyles}
                    onClick={() => scrollTo({ y: 0 })}
                  >
                    {t("mdx.scrollToTop")}
                  </Button>
                )}
              </Transition>
            </Affix>
          </Grid.Col>

          {showToc && (
            <Grid.Col span={3} visibleFrom="xl">
              <TableOfContentsDesktop />
            </Grid.Col>
          )}
        </Grid>
      </Container>

      {showToc && <TableOfContentsMobile />}
    </>
  );
}
