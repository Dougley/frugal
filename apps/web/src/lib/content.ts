import type { ComponentType } from "react";
import { defaultLanguage, type SupportedLanguage } from "./i18n";

export type Frontmatter = {
  /** Page title */
  title: string;
  /** Page description for meta tags */
  description: string;
  /** Publication date (YYYY-MM-DD or ISO date string) */
  published?: string;
  /** Legacy date field (ISO date string) */
  date?: string;
  /** Whether to feature this page */
  featured?: boolean;
  /** Whether to show table of contents */
  showtoc?: boolean;
  /** Draft status (legacy field) */
  draft?: boolean;
  /** Page tags for categorization */
  tags?: string[];
  /** Sidebar badge configuration */
  badge?: {
    text: string;
    variant?: "new" | "deprecated" | "experimental" | "beta";
  };
  /** Custom edit page URL (overrides default git URL) */
  editUrl?: string | false;
  /** Last updated date (YYYY-MM-DD or ISO date string) */
  lastUpdated?: string | false;
  /** Estimated reading time in minutes (optional, can be calculated automatically) */
  readingTime?: number;
  /** Hero section configuration for splash pages */
  hero?: {
    title?: string;
    tagline?: string;
    image?: string;
    actions?: Array<{
      text: string;
      link: string;
      variant?: "filled" | "light" | "outline";
    }>;
  };
  /** Previous page navigation */
  prev?:
    | {
        link: string;
        label: string;
      }
    | false;
  /** Next page navigation */
  next?:
    | {
        link: string;
        label: string;
      }
    | false;
  /** Sidebar customization */
  sidebar?: {
    label?: string;
    order?: number;
    hidden?: boolean;
  };
};

export type MdxModule = {
  default: ComponentType;
  frontmatter: Frontmatter;
};

export type ContentMeta = {
  slug: string;
  frontmatter: Frontmatter;
  /** Whether this content is available in the requested language */
  isTranslated: boolean;
  /** The language this content is from (may be fallback) */
  language: SupportedLanguage;
};

/**
 * Import all MDX files from the content directory for listing purposes.
 * Files are organized by language and category (e.g., en/legal/, nl/wiki/).
 */
const contentModules = import.meta.glob<MdxModule>("../content/**/*.mdx", {
  eager: true,
});

/**
 * Get all content pages for a specific category in the requested language.
 * Falls back to default language (English) for pages that don't have translations.
 * Useful for building index pages that list all documents.
 *
 * @param category - The content category (e.g., "legal", "wiki/getting-started")
 * @param language - The requested language (defaults to English)
 * @returns Array of content metadata with slugs, frontmatter, and translation status
 */
export function getContentList(
  category: string,
  language: SupportedLanguage = defaultLanguage
): ContentMeta[] {
  // First, get all pages from the default language (English) as the base
  const defaultPrefix = `../content/${defaultLanguage}/${category}/`;
  const requestedPrefix = `../content/${language}/${category}/`;

  // Build a map of all available pages from the default language
  const pageMap = new Map<string, ContentMeta>();

  // Add all default language pages
  for (const [path, module] of Object.entries(contentModules)) {
    if (!path.startsWith(defaultPrefix)) continue;

    const slug = path.replace(defaultPrefix, "").replace(".mdx", "");
    // Skip nested directories (we only want direct children)
    if (slug.includes("/")) continue;

    pageMap.set(slug, {
      slug,
      frontmatter: module.frontmatter,
      isTranslated: language === defaultLanguage, // English is always "translated"
      language: defaultLanguage,
    });
  }

  // If requesting a different language, check for translations
  if (language !== defaultLanguage) {
    for (const [path, module] of Object.entries(contentModules)) {
      if (!path.startsWith(requestedPrefix)) continue;

      const slug = path.replace(requestedPrefix, "").replace(".mdx", "");
      // Skip nested directories
      if (slug.includes("/")) continue;

      // Override with translated version
      pageMap.set(slug, {
        slug,
        frontmatter: module.frontmatter,
        isTranslated: true,
        language: language,
      });
    }
  }

  // Convert to array and filter out drafts
  return Array.from(pageMap.values()).filter((page) => !page.frontmatter.draft);
}

/**
 * Get all content pages across all categories.
 * @param language - The requested language (defaults to English)
 * @returns Array of content metadata with category, slug, frontmatter, and translation status
 */
export function getAllContent(
  language: SupportedLanguage = defaultLanguage
): Array<ContentMeta & { category: string }> {
  // First, collect all pages from the default language
  const pageMap = new Map<string, ContentMeta & { category: string }>();

  // Add all default language pages
  for (const [path, module] of Object.entries(contentModules)) {
    // Path format: ../content/{language}/{category}/{slug}.mdx
    // Can also be: ../content/{language}/{category}/{subcategory}/{slug}.mdx
    const defaultMatch = path.match(
      new RegExp(`^\\.\\./content/${defaultLanguage}/(.+)/([^/]+)\\.mdx$`)
    );
    if (!defaultMatch) continue;

    const [, category, slug] = defaultMatch;
    const key = `${category}/${slug}`;

    pageMap.set(key, {
      category,
      slug,
      frontmatter: module.frontmatter,
      isTranslated: language === defaultLanguage,
      language: defaultLanguage,
    });
  }

  // If requesting a different language, check for translations
  if (language !== defaultLanguage) {
    for (const [path, module] of Object.entries(contentModules)) {
      const langMatch = path.match(
        new RegExp(`^\\.\\./content/${language}/(.+)/([^/]+)\\.mdx$`)
      );
      if (!langMatch) continue;

      const [, category, slug] = langMatch;
      const key = `${category}/${slug}`;

      pageMap.set(key, {
        category,
        slug,
        frontmatter: module.frontmatter,
        isTranslated: true,
        language: language,
      });
    }
  }

  return Array.from(pageMap.values()).filter((page) => !page.frontmatter.draft);
}
