declare module "*.mdx" {
  import type { MDXProps } from "mdx/types";
  import type { Frontmatter } from "~/lib/content";

  export const frontmatter: Frontmatter;

  export default function MDXContent(props: MDXProps): JSX.Element;
}
