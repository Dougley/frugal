export type Frontmatter = {
  title: string;
  description: string;
  published: string; // YYYY-MM-DD
  featured: boolean;
  showtoc: boolean;
};

export type PageMeta = {
  slug: string;
  frontmatter: Frontmatter;
};

const modules = import.meta.glob<{ frontmatter: Frontmatter }>(
  "../routes/*.mdx",
  { eager: true },
);

export const getPage = (slug: string): PageMeta => {
  const id = `../routes/${slug.slice(1).replace(/\//g, ".")}.mdx`;
  const page = modules[id];
  if (!page) throw new Error(`No page found for ${slug}`);
  return {
    slug,
    frontmatter: page.frontmatter,
  };
};

export const getPages = (): PageMeta[] => {
  return Object.keys(modules).map((id) => {
    const slug = id.replace("../routes/", "/").replace(".mdx", "");
    return {
      slug,
      frontmatter: modules[id].frontmatter,
    };
  });
};
