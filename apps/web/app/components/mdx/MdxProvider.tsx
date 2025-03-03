import { MDXProvider } from "@mdx-js/react";
import { BlockQuote } from "~/components/mdx/BlockQuote/BlockQuote";
import { CodeBlock } from "~/components/mdx/CodeBlock/CodeBlock";
import { CodeHighlightBlock } from "~/components/mdx/CodeHighlight/CodeHighlight";

export function MdxProvider({ children }: { children: React.ReactNode }) {
  return (
    <MDXProvider
      components={{
        blockquote: BlockQuote,
        pre: CodeHighlightBlock,
        code: CodeBlock,
      }}
    >
      {children}
    </MDXProvider>
  );
}
