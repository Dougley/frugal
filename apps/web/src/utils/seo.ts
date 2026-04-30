/**
 * SEO utilities for meta tags and OpenGraph integration
 *
 * Provides a centralized way to generate consistent meta tags across all routes.
 * Uses TanStack Router's head function pattern.
 */

export interface SeoOptions {
  /**
   * Page title - will be appended with site name
   */
  title: string;
  /**
   * Page description for search engines and social sharing
   */
  description: string;
  /**
   * OpenGraph image URL (absolute or relative to site root)
   * @default '/og-default.png'
   */
  image?: string;
  /**
   * Canonical URL for this page
   */
  url?: string;
  /**
   * OpenGraph content type
   * @default 'website'
   */
  type?: "website" | "article";
  /**
   * Prevent search engines from indexing this page
   * @default false
   */
  noIndex?: boolean;
  /**
   * Article-specific metadata (only used when type is 'article')
   */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

const SITE_NAME = "GiveawayBot";
const SITE_URL = import.meta.env.VITE_SITE_URL;
const DEFAULT_IMAGE = "/og-default.png";
const TWITTER_SITE = "@GiveawayBot"; // Update with actual Twitter handle if available

/**
 * Resolves an image path to an absolute URL
 */
function resolveImageUrl(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

/**
 * Creates meta tags for SEO and social sharing
 *
 * @example
 * ```ts
 * // In a route file
 * import { createMeta } from '~/utils/seo';
 *
 * export const Route = createFileRoute('/premium')({
 *   head: () => ({
 *     meta: createMeta({
 *       title: 'Premium Features',
 *       description: 'Unlock premium features for your Discord server.',
 *       url: '/premium',
 *     }),
 *   }),
 * });
 * ```
 */
export function createMeta(options: SeoOptions): Array<Record<string, string>> {
  const {
    title,
    description,
    image = DEFAULT_IMAGE,
    url,
    type = "website",
    noIndex = false,
    article,
  } = options;

  const fullTitle = `${title} | ${SITE_NAME}`;
  const imageUrl = resolveImageUrl(image);
  const fullUrl = url
    ? `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`
    : undefined;

  const meta: Array<Record<string, string>> = [
    // Basic meta tags
    { title: fullTitle },
    { name: "description", content: description },

    // OpenGraph tags (use 'property' attribute for OG)
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: imageUrl },
    { property: "og:type", content: type },
    { property: "og:site_name", content: SITE_NAME },

    // Twitter Card tags
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:site", content: TWITTER_SITE },
  ];

  // Add URL-specific tags
  if (fullUrl) {
    meta.push({ property: "og:url", content: fullUrl });
  }

  // Add robots meta if noIndex is set
  if (noIndex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  // Add article-specific tags
  if (type === "article" && article) {
    if (article.publishedTime) {
      meta.push({
        property: "article:published_time",
        content: article.publishedTime,
      });
    }
    if (article.modifiedTime) {
      meta.push({
        property: "article:modified_time",
        content: article.modifiedTime,
      });
    }
    if (article.author) {
      meta.push({ property: "article:author", content: article.author });
    }
    if (article.section) {
      meta.push({ property: "article:section", content: article.section });
    }
    if (article.tags) {
      for (const tag of article.tags) {
        meta.push({ property: "article:tag", content: tag });
      }
    }
  }

  return meta;
}

/**
 * Creates a canonical link tag
 *
 * @example
 * ```ts
 * head: () => ({
 *   meta: createMeta({ ... }),
 *   links: [createCanonicalLink('/premium')],
 * }),
 * ```
 */
export function createCanonicalLink(path: string): {
  rel: string;
  href: string;
} {
  const fullUrl = `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  return { rel: "canonical", href: fullUrl };
}

/**
 * Default meta tags for pages that don't need custom SEO
 * Useful for authenticated/private pages
 */
export const noIndexMeta: Array<Record<string, string>> = [
  { name: "robots", content: "noindex, nofollow" },
];
