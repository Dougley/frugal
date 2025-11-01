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
import type { ParticipantsTableProps } from "./types";

const ITEMS_PER_PAGE = 10;

export default function ParticipantsTable({
  participants,
}: ParticipantsTableProps) {
  const [activePage, setActivePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) {
      return participants;
    }

    const query = searchQuery.toLowerCase();
    return participants.filter((participant) => {
      const username = participant.username.toLowerCase();
      const fullUsername = participant.discriminator
        ? `${username}#${participant.discriminator}`
        : username;
      return fullUsername.includes(query) || participant.id.includes(query);
    });
  }, [participants, searchQuery]);

  const totalPages = Math.ceil(filteredParticipants.length / ITEMS_PER_PAGE);
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedParticipants = filteredParticipants.slice(
    startIndex,
    endIndex
  );

  // Reset to page 1 when search query changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setActivePage(1);
  };

  return (
    <Stack gap="md">
      <Title order={2}>
        Participants (
        <span aria-live="polite">{filteredParticipants.length}</span>)
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
          {paginatedParticipants.map((participant) => (
            <Table.Tr key={participant.id}>
              <Table.Td>
                <Text>
                  {participant.username}
                  {participant.discriminator && `#${participant.discriminator}`}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {participant.id}
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
