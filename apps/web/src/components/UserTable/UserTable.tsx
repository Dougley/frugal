import {
  LoadingOverlay,
  Pagination,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { UserTableProps } from "./types";

const DEFAULT_CLIENT_ITEMS_PER_PAGE = 10;

/**
 * Generic user table component with search, pagination, and loading states
 *
 * Supports two pagination modes:
 * 1. Client-side (default): All data is provided upfront, filtered and paginated locally
 * 2. Server-side: Data comes from server per page, controlled via onPageChange callback
 *
 * @example Client-side pagination (default)
 * ```tsx
 * <UserTable
 *   users={allUsers}
 *   title="Winners"
 *   searchPlaceholder="Search winners..."
 * />
 * ```
 *
 * @example Server-side pagination
 * ```tsx
 * <UserTable
 *   users={currentPageUsers}
 *   title="Participants"
 *   searchPlaceholder="Search participants..."
 *   serverPagination={{
 *     page: currentPage,
 *     total: totalCount,
 *     limit: 25,
 *     hasMore: hasMorePages,
 *     isLoading: isLoadingPage
 *   }}
 *   onPageChange={setCurrentPage}
 * />
 * ```
 */
export function UserTable({
  users,
  title,
  searchPlaceholder,
  serverPagination,
  onPageChange,
  clientItemsPerPage = DEFAULT_CLIENT_ITEMS_PER_PAGE,
  showSearch,
}: UserTableProps) {
  const [clientPage, setClientPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  const isServerPaginated = !!serverPagination;

  // Determine whether to show search - defaults to true for client pagination, false for server
  const shouldShowSearch = showSearch ?? !isServerPaginated;

  // Filter users by search query (only for client-side pagination)
  const filteredUsers = useMemo(() => {
    if (isServerPaginated || !searchQuery.trim()) {
      return users;
    }

    const query = searchQuery.toLowerCase();
    return users.filter((user) => {
      const username = user.username.toLowerCase();
      const fullUsername = user.discriminator
        ? `${username}#${user.discriminator}`
        : username;
      return fullUsername.includes(query) || user.id.includes(query);
    });
  }, [users, searchQuery, isServerPaginated]);

  // Calculate pagination values
  const totalItems = isServerPaginated
    ? serverPagination.total
    : filteredUsers.length;
  const itemsPerPage = isServerPaginated
    ? serverPagination.limit
    : clientItemsPerPage;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = isServerPaginated ? serverPagination.page : clientPage;

  // Get items to display
  const displayItems = isServerPaginated
    ? users // Server already paginated
    : filteredUsers.slice(
        (clientPage - 1) * clientItemsPerPage,
        clientPage * clientItemsPerPage
      );

  // Handle page change
  const handlePageChange = (page: number) => {
    if (isServerPaginated && onPageChange) {
      onPageChange(page);
    } else {
      setClientPage(page);
    }
  };

  // Reset to page 1 when search query changes (client-side only)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (!isServerPaginated) {
      setClientPage(1);
    }
  };

  return (
    <Stack gap="md" pos="relative">
      <LoadingOverlay
        visible={serverPagination?.isLoading ?? false}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />

      <Title order={2}>
        {title} (<span aria-live="polite">{totalItems}</span>)
      </Title>

      {shouldShowSearch && (
        <TextInput
          placeholder={searchPlaceholder}
          leftSection={<IconSearch size={16} aria-hidden="true" />}
          value={searchQuery}
          onChange={(event) => handleSearchChange(event.currentTarget.value)}
        />
      )}

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("tables.headers.user")}</Table.Th>
            <Table.Th>{t("tables.headers.id")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {displayItems.map((user) => (
            <Table.Tr key={user.id}>
              <Table.Td>
                <Text>
                  {user.username}
                  {user.discriminator && `#${user.discriminator}`}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {user.id}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {totalPages > 1 && (
        <Pagination
          total={totalPages}
          value={currentPage}
          onChange={handlePageChange}
          mt="md"
        />
      )}
    </Stack>
  );
}
