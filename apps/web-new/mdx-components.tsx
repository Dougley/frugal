import { BlockQuote } from "./app/components/mdx/BlockQuote/BlockQuote";
import { CodeBlock } from "./app/components/mdx/CodeBlock/CodeBlock";
import { CodeHighlightBlock } from "./app/components/mdx/CodeHighlight/CodeHighlight";

export function useMDXComponents(components: any) {
  return {
    ...components,
    code: CodeBlock,
    blockquote: BlockQuote,
    pre: CodeHighlightBlock,
  };
}
