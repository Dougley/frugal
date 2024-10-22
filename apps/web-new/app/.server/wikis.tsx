// @ts-nocheck
// prettier-ignore

export type Frontmatter = {
  title: string;
  description: string;
  published: string; // YYYY-MM-DD
  featured: boolean;
};

export type WikiMeta = {
  slug: string;
  frontmatter: Frontmatter;
};

export const getWikis = async (): Promise<WikiMeta[]> => {
  const modules = import.meta.glob<{ frontmatter: Frontmatter }>(
    "../routes/wiki.*.mdx",
    { eager: true },
  );
  const build = await import("virtual:remix/server-build");
  const wikis = Object.entries(modules).map(([file, wiki]) => {
    let id = file.replace("../", "").replace(/\.mdx$/, "");
    let slug = build.routes[id].path;
    if (slug === undefined) throw new Error(`No route for ${id}`);

    return {
      slug,
      frontmatter: wiki.frontmatter,
    };
  });
  return sortBy(wikis, (wiki) => wiki.frontmatter.published, "desc");
};

function sortBy<T>(
  arr: T[],
  key: (item: T) => any,
  dir: "asc" | "desc" = "asc",
) {
  return arr.sort((a, b) => {
    const res = compare(key(a), key(b));
    return dir === "asc" ? res : -res;
  });
}

function compare<T>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
