import { Link, useLoaderData } from "@remix-run/react";
import type { WikiMeta } from "../.server/wikis";
import { getWikis } from "../.server/wikis";

export const loader = async () => {
  return {
    posts: await getWikis(),
  };
};

export default function Component() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <div className="p-10">
      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.slug}>
            <Post {...post} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export const Post = ({ slug, frontmatter }: WikiMeta) => {
  return (
    <article className="space-y-2">
      <Link to={`/wiki/${slug}`}>
        <h3 className="text-3xl font-bold">{frontmatter.title}</h3>
      </Link>
      <p className="text-gray-600">{frontmatter.description}</p>
      <time
        className="block text-sm text-cyan-700"
        dateTime={frontmatter.published}
      >
        {frontmatter.published.replace(/-/g, "/")}
      </time>
    </article>
  );
};
