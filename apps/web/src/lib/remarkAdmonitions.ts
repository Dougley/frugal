import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/**
 * Remark plugin to transform GitHub-style admonitions in blockquotes.
 *
 * Supports:
 * - [!NOTE]
 * - [!TIP]
 * - [!IMPORTANT]
 * - [!WARNING]
 * - [!CAUTION]
 *
 * With optional custom titles: [!NOTE] "Custom Title"
 */
export const remarkAdmonitions: Plugin = () => {
  return (tree) => {
    // biome-ignore lint/suspicious/noExplicitAny: difficult to type with unist
    visit(tree, "blockquote", (node: any) => {
      const [firstParagraph] = node.children;

      if (
        firstParagraph?.type === "paragraph" &&
        firstParagraph.children?.[0]?.value
      ) {
        const text = firstParagraph.children[0].value.trim();
        // Match pattern: [!TYPE] optionally followed by "Custom Title" and/or content
        const match = text.match(
          /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s+"([^"]+)")?\s*(.*)/is
        );

        if (match) {
          const type = match[1].toLowerCase();
          const customTitle = match[2]; // Title in quotes (optional)
          const remainingContent = match[3]?.trim(); // Content after the tag (optional)

          // Modify the node to include the admonition type
          node.data = node.data || {};
          node.data.hProperties = node.data.hProperties || {};
          node.data.hProperties.dataType = type;

          // If there's a custom title, add it to hProperties
          if (customTitle) {
            node.data.hProperties.title = customTitle;
          }

          // Handle the content
          if (remainingContent) {
            // There's content on the same line as the tag, update it
            firstParagraph.children[0].value = remainingContent;
          } else {
            // No content on the same line, remove the first paragraph
            node.children.shift();
          }

          // Remove any empty paragraphs
          node.children = node.children.filter(
            // biome-ignore lint/suspicious/noExplicitAny: difficult to type with unist
            (child: any) =>
              !(
                child.type === "paragraph" &&
                (!child.children?.length ||
                  (child.children.length === 1 &&
                    !child.children[0].value?.trim()))
              )
          );
        }
      }
    });
  };
};
