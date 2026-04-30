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

export type PageMeta = {
  slug: string;
  frontmatter: Frontmatter;
};
