import { Stack, Table, Text, Title } from "@mantine/core";
import type { ParticipantsTableProps } from "./types";

export default function ParticipantsTable({
  participants,
}: ParticipantsTableProps) {
  return (
    <Stack gap="md">
      <Title order={2}>Participants</Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>User</Table.Th>
            <Table.Th>ID</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {participants.map((participant) => (
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
    </Stack>
  );
}
