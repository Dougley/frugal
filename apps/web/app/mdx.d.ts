declare module "*.mdx" {
  import type { Frontmatter } from "~/utils/mdx";

  export const frontmatter: Frontmatter;

  const MDXComponent: (props: unknown) => JSX.Element;
  export default MDXComponent;
}
