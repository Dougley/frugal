/**
 * Utilities for loading localized MDX content
 *
 * MDX content is organized by language:
 * - src/content/en/legal/privacy.mdx (English - default)
 * - src/content/nl/legal/privacy.mdx (Dutch)
 *
 * When a translation doesn't exist, falls back to English.
 */

import { useEffect, useState } from "react";
import type { Frontmatter } from "~/utils/mdx";
import { defaultLanguage, type SupportedLanguage } from "./i18n";

/**
 * Content paths available in the application
 */
export type ContentPath =
  // Legal pages
  | "legal/privacy"
  | "legal/terms"
  | "legal/paid-services"
  // Wiki pages
  | "wiki/getting-started/quick-start"
  | "wiki/developer/components"
  | "wiki/developer/markdown-test"
  | "wiki/reference/commands";

/**
 * MDX module structure returned by dynamic imports
 */
export interface MdxModule {
  default: React.ComponentType;
  frontmatter: Frontmatter;
}

/**
 * Map of all available MDX content modules by language
 *
 * This uses Vite's glob import to statically analyze all MDX files.
 * The eager: false option enables lazy loading.
 */
const contentModules = import.meta.glob<MdxModule>("../content/**/*.mdx");

/**
 * Get the module path for a content path and language
 */
function getModulePath(
  contentPath: ContentPath,
  language: SupportedLanguage
): string {
  return `../content/${language}/${contentPath}.mdx`;
}

/**
 * Check if content exists for a specific language
 */
export function hasTranslation(
  contentPath: ContentPath,
  language: SupportedLanguage
): boolean {
  const modulePath = getModulePath(contentPath, language);
  return modulePath in contentModules;
}

/**
 * Get the best available language for content
 *
 * Returns the requested language if available, otherwise falls back to default.
 */
export function getAvailableLanguage(
  contentPath: ContentPath,
  preferredLanguage: SupportedLanguage
): SupportedLanguage {
  if (hasTranslation(contentPath, preferredLanguage)) {
    return preferredLanguage;
  }
  return defaultLanguage;
}

/**
 * Serializable metadata about MDX content (for use in loaders)
 */
export interface MdxContentMeta {
  /**
   * The frontmatter data from the MDX file
   */
  frontmatter: Frontmatter;
  /**
   * The language that was actually loaded (may differ from requested if fallback occurred)
   */
  loadedLanguage: SupportedLanguage;
  /**
   * Whether the content is a fallback (requested language wasn't available)
   */
  isFallback: boolean;
  /**
   * The language that was originally requested
   */
  requestedLanguage: SupportedLanguage;
}

/**
 * Result of loading MDX content, including the component (for client-side use only)
 */
export interface MdxLoadResult extends MdxContentMeta {
  /**
   * The MDX component to render (not serializable - use only on client)
   */
  Content: React.ComponentType;
}

/**
 * Get serializable metadata about MDX content (for use in loaders)
 *
 * This only returns serializable data that can be passed from server to client.
 * Use `loadMdxContent` on the client to get the actual component.
 *
 * @param contentPath - The content path (e.g., "legal/privacy")
 * @param language - The preferred language
 * @returns Serializable metadata about the content
 */
export async function getMdxContentMeta(
  contentPath: ContentPath,
  language: SupportedLanguage
): Promise<MdxContentMeta> {
  const actualLanguage = getAvailableLanguage(contentPath, language);
  const modulePath = getModulePath(contentPath, actualLanguage);

  const loader = contentModules[modulePath];
  if (!loader) {
    throw new Error(
      `MDX content not found: ${contentPath} (tried ${modulePath})`
    );
  }

  const module = await loader();

  return {
    frontmatter: module.frontmatter,
    loadedLanguage: actualLanguage,
    isFallback: actualLanguage !== language,
    requestedLanguage: language,
  };
}

/**
 * Load MDX content for a specific path and language (client-side use)
 *
 * Falls back to English if the requested language is not available.
 *
 * @param contentPath - The content path (e.g., "legal/privacy")
 * @param language - The preferred language
 * @returns The MDX module with component, frontmatter, and fallback info
 *
 * @example
 * ```tsx
 * const { Content, frontmatter, isFallback } = await loadMdxContent("legal/privacy", "nl");
 * if (isFallback) {
 *   // Show "This page is not available in your language" banner
 * }
 * ```
 */
export async function loadMdxContent(
  contentPath: ContentPath,
  language: SupportedLanguage
): Promise<MdxLoadResult> {
  const actualLanguage = getAvailableLanguage(contentPath, language);
  const modulePath = getModulePath(contentPath, actualLanguage);

  const loader = contentModules[modulePath];
  if (!loader) {
    throw new Error(
      `MDX content not found: ${contentPath} (tried ${modulePath})`
    );
  }

  const module = await loader();

  return {
    Content: module.default,
    frontmatter: module.frontmatter,
    loadedLanguage: actualLanguage,
    isFallback: actualLanguage !== language,
    requestedLanguage: language,
  };
}

/**
 * Get metadata about available translations for a content path
 *
 * Useful for showing language availability indicators in the UI.
 */
export function getTranslationInfo(contentPath: ContentPath): {
  availableLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
} {
  const available: SupportedLanguage[] = [];

  // Check each supported language
  const languages: SupportedLanguage[] = ["en", "nl"];
  for (const lang of languages) {
    if (hasTranslation(contentPath, lang)) {
      available.push(lang);
    }
  }

  return {
    availableLanguages: available,
    defaultLanguage,
  };
}

/**
 * Hook state for MDX content loading
 */
interface UseMdxContentState {
  Content: React.ComponentType | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * React hook to load MDX content client-side
 *
 * Use this in route components where the loader provides metadata
 * but the actual MDX component needs to be loaded on the client.
 *
 * @param contentPath - The content path (e.g., "legal/privacy")
 * @param language - The language to load (typically from loader data)
 * @returns Object with Content component, loading state, and error
 *
 * @example
 * ```tsx
 * function PrivacyPage() {
 *   const { frontmatter, loadedLanguage, isFallback } = Route.useLoaderData();
 *   const { Content, isLoading } = useMdxContent("legal/privacy", loadedLanguage);
 *
 *   if (isLoading || !Content) return <LoadingSpinner />;
 *
 *   return (
 *     <MdxPage frontmatter={frontmatter} isFallback={isFallback}>
 *       <Content />
 *     </MdxPage>
 *   );
 * }
 * ```
 */
export function useMdxContent(
  contentPath: ContentPath,
  language: SupportedLanguage
): UseMdxContentState {
  const [state, setState] = useState<UseMdxContentState>({
    Content: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const result = await loadMdxContent(contentPath, language);
        if (!cancelled) {
          setState({
            Content: result.Content,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            Content: null,
            isLoading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [contentPath, language]);

  return state;
}
