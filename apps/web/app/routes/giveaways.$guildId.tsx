import { eq } from "@dougley/frugal-drizzle/workers";
import * as Schema from "@dougley/frugal-drizzle/workers/schema.js";
import {
  Badge,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { formatDistanceToNow } from "date-fns";
import { PermissionFlagsBits } from "discord-api-types/v10";
import { BitField } from "discord-bitflag";
import { NotLoggedIn } from "~/components/NotLoggedIn/NotLoggedIn";
import { getLoggedInUser } from "~/utils/auth";
import type { Route } from "./+types/giveaways.$guildId";

export async function loader({ context, request, params }: Route.LoaderArgs) {
  const currentUser = await getLoggedInUser(request, context);
  if (!currentUser) {
    return {
      loggedIn: false,
      guild: null,
      giveaways: [],
    };
  }

  const guild = currentUser.guilds.find((g) => g.id === params.guildId);
  if (!guild) {
    throw new Response("Guild not found", { status: 404 });
  }

  // Check if user has ManageEvents permission
  const hasPermission = new BitField(BigInt(guild.permissions)).has(
    PermissionFlagsBits.ManageEvents,
  );
  if (!hasPermission) {
    throw new Response(
      "You don't have permission to view this guild's giveaways",
      {
        status: 403,
      },
    );
  }

  const giveaways = await context.drizzle.query.giveaways.findMany({
    where: eq(Schema.giveaways.guildId, guild.id),
  });

  return {
    loggedIn: true,
    guild,
    giveaways,
  };
}

export default function GuildGiveaways({ loaderData }: Route.ComponentProps) {
  const { loggedIn, guild, giveaways } = loaderData;

  if (!loggedIn || !guild) {
    return <NotLoggedIn />;
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Title order={1}>{guild!.name} Giveaways</Title>
          <Badge size="lg" variant="light">
            {giveaways.length} Active Giveaways
          </Badge>
        </Group>

        {giveaways.length === 0 ? (
          <Text c="dimmed">No active giveaways in this guild.</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {giveaways.map((g) => (
              <Card key={g.messageId} shadow="sm" radius="md" withBorder>
                <Stack gap="xs">
                  <Title order={4} size="h5">
                    {g.prize}
                  </Title>
                  <Text c="dimmed" size="sm">
                    Ends{" "}
                    {formatDistanceToNow(new Date(g.endTime), {
                      addSuffix: true,
                    })}
                  </Text>
                  <Badge color={g.state === "OPEN" ? "green" : "red"}>
                    {g.state}
                  </Badge>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
