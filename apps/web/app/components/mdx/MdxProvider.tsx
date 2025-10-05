import { MDXProvider } from "@mdx-js/react";
import type { ReactNode } from "react";
import { BlockQuote } from "~/components/mdx/BlockQuote/BlockQuote";
import { Card } from "~/components/mdx/Card/Card";
import { CardGrid } from "~/components/mdx/CardGrid/CardGrid";
import { CodeBlock } from "~/components/mdx/CodeBlock/CodeBlock";
import { CodeHighlightBlock } from "~/components/mdx/CodeHighlight/CodeHighlight";
import { CodeTab, CodeTabs } from "~/components/mdx/CodeTabs/CodeTabs";
import { Details } from "~/components/mdx/Details/Details";
import { DocBadge } from "~/components/mdx/DocBadge/DocBadge";
import { DocGrid } from "~/components/mdx/DocGrid/DocGrid";
import { DocIcon } from "~/components/mdx/DocIcon/DocIcon";
import { DocTabs, TabItem } from "~/components/mdx/DocTabs/DocTabs";
import { FileTree } from "~/components/mdx/FileTree/FileTree";
import { HeaderAnchor, generateHeadingId } from "~/components/mdx/HeaderAnchor";
import { ClickableImage } from "~/components/mdx/ImageViewer/ImageViewer";
import { LinkCard } from "~/components/mdx/LinkCard/LinkCard";
import { Steps } from "~/components/mdx/Steps/Steps";

// Wrapper components for headings with anchor links
const createHeadingComponent = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
  return ({ children }: { children: ReactNode }) => {
    const id = generateHeadingId(children);
    return (
      <HeaderAnchor id={id} level={level}>
        {children}
      </HeaderAnchor>
    );
  };
};

export function MdxProvider({ children }: { children: React.ReactNode }) {
  return (
    <MDXProvider
      components={{
        // Standard markdown overrides with anchor links
        h2: createHeadingComponent(2),
        h3: createHeadingComponent(3),
        h4: createHeadingComponent(4),
        h5: createHeadingComponent(5),
        h6: createHeadingComponent(6),
        blockquote: BlockQuote,
        pre: CodeHighlightBlock,
        code: CodeBlock,
        img: ClickableImage,
        // Custom documentation components
        BlockQuote,
        Card,
        CardGrid,
        LinkCard,
        Steps,
        DocTabs,
        TabItem,
        CodeTabs,
        CodeTab,
        DocBadge,
        FileTree,
        DocIcon,
        DocGrid,
        Details,
      }}
    >
      {children}
    </MDXProvider>
  );
}
