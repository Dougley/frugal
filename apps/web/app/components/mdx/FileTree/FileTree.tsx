import {
  Box,
  Collapse,
  Group,
  ScrollArea,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconBrandGolang,
  IconBrandPython,
  IconBrandRust,
  IconChevronDown,
  IconChevronRight,
  IconFile,
  IconFileTypeCss,
  IconFileTypeDocx,
  IconFileTypeHtml,
  IconFileTypeJs,
  IconFileTypeTs,
  IconFolder,
  IconFolderOpen,
  IconJson,
  IconMarkdown,
} from "@tabler/icons-react";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useState,
} from "react";
import styles from "./FileTree.module.css";

interface FileTreeProps {
  children: ReactNode;
}

interface FileTreeItemProps {
  name: string;
  type?: "file" | "folder";
  children?: ReactNode;
  comment?: string;
  isHighlighted?: boolean;
  isPlaceholder?: boolean;
}

// Get icon based on file extension
function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();

  const iconMap: Record<string, typeof IconFile> = {
    js: IconFileTypeJs,
    jsx: IconFileTypeJs,
    ts: IconFileTypeTs,
    tsx: IconFileTypeTs,
    css: IconFileTypeCss,
    scss: IconFileTypeCss,
    html: IconFileTypeHtml,
    py: IconBrandPython,
    rs: IconBrandRust,
    go: IconBrandGolang,
    json: IconJson,
    md: IconMarkdown,
    mdx: IconMarkdown,
    yml: IconFileTypeDocx,
    yaml: IconFileTypeDocx,
  };

  const Icon = iconMap[ext || ""] || IconFile;
  return <Icon size={16} />;
}

function FileTreeItem({
  name,
  type = "file",
  children,
  comment,
  isHighlighted = false,
  isPlaceholder = false,
}: FileTreeItemProps) {
  const hasChildren = Children.count(children) > 0;
  const isFolder = type === "folder" || hasChildren;
  const [isOpen, setIsOpen] = useState(true);

  const renderContent = () => (
    <Group gap={6} wrap="nowrap" align="flex-start">
      <Box className={styles.iconWrapper}>
        {isFolder && hasChildren && (
          <Box component="span" c="gray.6" className={styles.chevron}>
            {isOpen ? (
              <IconChevronDown size={12} stroke={2.5} />
            ) : (
              <IconChevronRight size={12} stroke={2.5} />
            )}
          </Box>
        )}
        <Box c={isFolder ? "blue.6" : "gray.6"} className={styles.icon}>
          {isFolder ? (
            isOpen && hasChildren ? (
              <IconFolderOpen size={16} />
            ) : (
              <IconFolder size={16} />
            )
          ) : (
            getFileIcon(name)
          )}
        </Box>
      </Box>
      {/* Render comment if it exists, affix it to the end of the filename, spaced equidistant to each other */}
      <Box className={styles.contentRow}>
        <Box
          className={`${styles.filenameWrapper} ${isHighlighted ? styles.filenameWrapperHighlighted : ""}`}
        >
          <Text
            ff="monospace"
            size="sm"
            m={0}
            c={isPlaceholder ? "dimmed" : undefined}
            className={styles.filename}
          >
            {name}
          </Text>
        </Box>
        {comment && (
          <Text ff="monospace" size="sm" c="dimmed" className={styles.comment}>
            <Text component="span" c="dimmed" opacity={0.5} mr={4}>
              {"//"}
            </Text>
            <Text component="span">{comment}</Text>
          </Text>
        )}
      </Box>
    </Group>
  );

  return (
    <Box component="li" className={styles.listItem}>
      {isFolder && hasChildren ? (
        <>
          <UnstyledButton
            onClick={() => setIsOpen(!isOpen)}
            mb={2}
            w="100%"
            className={styles.folderButton}
            styles={{
              root: {
                "&:hover": {
                  backgroundColor: "var(--mantine-color-default-hover)",
                },
              },
            }}
          >
            {renderContent()}
          </UnstyledButton>
          <Collapse in={isOpen}>
            <Box
              component="ul"
              data-type="taskList"
              className={styles.nestedList}
            >
              {Children.map(children, (child) => {
                if (isValidElement(child)) {
                  return child;
                }
                return null;
              })}
            </Box>
          </Collapse>
        </>
      ) : (
        <Box mb={2} className={styles.fileWrapper}>
          {renderContent()}
        </Box>
      )}
    </Box>
  );
}

export function FileTree({ children }: FileTreeProps) {
  // Parse markdown-style text content for highlighting, comments, and placeholders
  const parseTextContent = (text: string) => {
    const trimmed = text.trim();

    // Check for placeholder
    if (trimmed === "..." || trimmed === "…") {
      return {
        name: "…",
        isPlaceholder: true,
        isHighlighted: false,
        comment: undefined,
      };
    }

    // Check for comment delimiter //
    const commentIndex = trimmed.indexOf(" //");
    const hasComment = commentIndex !== -1;
    const mainPart = hasComment
      ? trimmed.substring(0, commentIndex).trim()
      : trimmed;
    const commentPart = hasComment
      ? trimmed.substring(commentIndex + 3).trim()
      : "";

    // Check if the main part uses bold syntax
    if (mainPart.startsWith("**")) {
      const closingIndex = mainPart.indexOf("**", 2);
      if (closingIndex !== -1) {
        const name = mainPart.substring(2, closingIndex);
        return {
          name: name,
          isHighlighted: true,
          isPlaceholder: false,
          comment: commentPart || undefined,
        };
      }
    }

    // Regular filename (no bold)
    return {
      name: mainPart,
      isHighlighted: false,
      isPlaceholder: false,
      comment: commentPart || undefined,
    };
  };

  // Process MDX children - MDX converts markdown lists to ul/li elements
  const processListItems = (nodes: ReactNode): ReactElement[] => {
    const items: ReactElement[] = [];

    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;

      const element = child as ReactElement<{
        children: ReactNode;
        mdxType?: string;
      }>;

      // If it's a ul, process its children
      if (element.type === "ul" || element.props.mdxType === "ul") {
        items.push(...processListItems(element.props.children));
      }
      // If it's an li, extract text and nested ul
      else if (element.type === "li" || element.props.mdxType === "li") {
        const childrenArray = Children.toArray(element.props.children);

        // Extract text content and nested list
        let textContent = "";
        let nestedList: ReactElement<{ children: ReactNode }> | null = null;
        let hasStrongTag = false;

        for (const item of childrenArray) {
          if (typeof item === "string") {
            textContent += item;
          } else if (isValidElement(item)) {
            const el = item as ReactElement<{
              mdxType?: string;
              children: ReactNode;
              type?: string | symbol;
            }>;
            if (item.type === "ul" || el.props.mdxType === "ul") {
              nestedList = el as ReactElement<{ children: ReactNode }>;
            } else if (
              item.type === "strong" ||
              el.props.mdxType === "strong"
            ) {
              // MDX converts **text** to <strong>text</strong>
              hasStrongTag = true;
              const strongChildren = Children.toArray(el.props.children);
              for (const strongChild of strongChildren) {
                if (typeof strongChild === "string") {
                  textContent += strongChild;
                }
              }
            }
          }
        }

        const hasNested = !!nestedList;
        const parsed = parseTextContent(textContent);

        // Override isHighlighted if we detected a <strong> tag from MDX
        if (hasStrongTag) {
          parsed.isHighlighted = true;
        }

        items.push(
          <FileTreeItem
            key={`${parsed.name}-${items.length}`}
            name={parsed.name || `Item ${items.length + 1}`}
            type={hasNested ? "folder" : "file"}
            comment={parsed.comment}
            isHighlighted={parsed.isHighlighted}
            isPlaceholder={parsed.isPlaceholder}
          >
            {hasNested && nestedList
              ? processListItems(nestedList.props.children)
              : null}
          </FileTreeItem>
        );
      }
    });

    return items;
  };

  return (
    <Box my="xl" className={styles.container}>
      <ScrollArea.Autosize maw="80vw" mx="auto">
        <Box
          p="md"
          component="ul"
          data-type="taskList"
          className={styles.rootList}
        >
          {processListItems(children)}
        </Box>
      </ScrollArea.Autosize>
    </Box>
  );
}

FileTree.Item = FileTreeItem;
