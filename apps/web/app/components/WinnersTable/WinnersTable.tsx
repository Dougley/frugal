import { Stack, Table, Text, Title } from "@mantine/core";
import type { WinnersTableProps } from "./types";

export default function WinnersTable({ winners }: WinnersTableProps) {
  return (
    <Stack gap="md">
      <Title order={2}>Winners</Title>
      <Text size="sm" c="dimmed">
        This is before any rerolls have been done.
      </Text>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>User</Table.Th>
            <Table.Th>ID</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {winners.map((winner) => (
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
    </Stack>
  );
}
