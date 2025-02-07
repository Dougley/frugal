import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const remarkAdmonitions: Plugin = () => {
  return (tree) => {
    visit(tree, "blockquote", (node: any) => {
      const [firstParagraph] = node.children;

      if (
        firstParagraph?.type === "paragraph" &&
        firstParagraph.children?.[0]?.value
      ) {
        const text = firstParagraph.children[0].value.trim();
        const match = text.match(
          /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)/i,
        );

        if (match) {
          const type = match[1].toLowerCase();
          // Modify the node to include the admonition type
          node.data = node.data || {};
          node.data.hProperties = node.data.hProperties || {};
          node.data.hProperties.dataType = type;

          // Clean up the content - remove extra line breaks and whitespace
          const cleanContent = match[2]
            .replace(/^\s*\n+|\n+\s*$/g, "") // Remove leading/trailing line breaks
            .replace(/\n+/g, " ") // Replace multiple line breaks with space
            .trim();

          // Update the content
          firstParagraph.children[0].value = cleanContent;

          // Remove any empty paragraphs that might follow
          node.children = node.children.filter(
            (child: any) =>
              !(
                child.type === "paragraph" &&
                (!child.children?.length ||
                  (child.children.length === 1 &&
                    !child.children[0].value?.trim()))
              ),
          );
        }
      }
    });
  };
};
