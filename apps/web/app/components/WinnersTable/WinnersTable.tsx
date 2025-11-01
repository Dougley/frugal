import {
  Pagination,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import type { WinnersTableProps } from "./types";

const ITEMS_PER_PAGE = 10;

export default function WinnersTable({ winners }: WinnersTableProps) {
  const [activePage, setActivePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWinners = useMemo(() => {
    if (!searchQuery.trim()) {
      return winners;
    }

    const query = searchQuery.toLowerCase();
    return winners.filter((winner) => {
      const username = winner.username.toLowerCase();
      const fullUsername = winner.discriminator
        ? `${username}#${winner.discriminator}`
        : username;
      return fullUsername.includes(query) || winner.id.includes(query);
    });
  }, [winners, searchQuery]);

  const totalPages = Math.ceil(filteredWinners.length / ITEMS_PER_PAGE);
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedWinners = filteredWinners.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setActivePage(1);
  };

  return (
    <Stack gap="md">
      <Title order={2}>
        Winners (<span aria-live="polite">{filteredWinners.length}</span>)
      </Title>
      <TextInput
        placeholder="Search by username or ID..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(event) => handleSearchChange(event.currentTarget.value)}
      />
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>User</Table.Th>
            <Table.Th>ID</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paginatedWinners.map((winner) => (
            <Table.Tr key={winner.id}>
              <Table.Td>
                <Text>
                  {winner.username}
                  {winner.discriminator && `#${winner.discriminator}`}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {winner.id}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {totalPages > 1 && (
        <Pagination
          total={totalPages}
          value={activePage}
          onChange={setActivePage}
          mt="md"
        />
      )}
    </Stack>
  );
}
