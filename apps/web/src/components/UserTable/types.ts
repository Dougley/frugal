/**
 * User data structure for the table
 */
export interface User {
  id: string;
  username: string;
  discriminator: string | null;
  avatar: string | null;
}

/**
 * Server-side pagination configuration
 */
export interface ServerPaginationProps {
  /** Current page number (1-indexed) */
  page: number;
  /** Total number of items across all pages */
  total: number;
  /** Number of items per page */
  limit: number;
  /** Whether there are more pages */
  hasMore: boolean;
  /** Whether a page is currently loading */
  isLoading?: boolean;
}

export interface UserTableProps {
  /** Array of users to display */
  users: User[];
  /** Table title (e.g., "Winners", "Participants") */
  title: string;
  /** Search input placeholder text */
  searchPlaceholder: string;
  /**
   * Server-side pagination configuration.
   * When provided, disables client-side pagination and search.
   */
  serverPagination?: ServerPaginationProps;
  /** Callback for page changes when using server-side pagination */
  onPageChange?: (page: number) => void;
  /** Number of items per page for client-side pagination (default: 10) */
  clientItemsPerPage?: number;
  /** Whether to show the search input (default: true for client pagination, false for server) */
  showSearch?: boolean;
}
