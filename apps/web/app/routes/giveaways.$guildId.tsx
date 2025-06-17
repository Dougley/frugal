import { eq } from "@dougley/frugal-drizzle/workers";
import * as Schema from "@dougley/frugal-drizzle/workers/schema.js";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { IconArrowLeft, IconInfoCircle } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { PermissionFlagsBits } from "discord-api-types/v10";
import { BitField } from "discord-bitflag";
import { Link, useNavigate } from "react-router";
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

function GiveawayCard({
  giveaway,
}: {
  giveaway: {
    messageId: string;
    prize: string;
    state: string;
    endTime: string;
    durableObjectId: string;
  };
}) {
  const { hovered, ref } = useHover();
  const isClosed = giveaway.state === "CLOSED";

  return (
    <Anchor
      component={Link}
      to={isClosed ? `/giveaways/summaries/${giveaway.durableObjectId}` : "#"}
      underline="never"
    >
      <Card
        ref={ref}
        shadow="sm"
        radius="md"
        withBorder
        style={{
          transition: "all 0.2s ease",
          cursor: isClosed ? "pointer" : "default",
          transform: hovered && isClosed ? "translateY(-2px)" : "none",
          boxShadow:
            hovered && isClosed ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "none",
        }}
      >
        <Stack gap="xs">
          <Title order={4} size="h5">
            {giveaway.prize}
          </Title>
          <Text c="dimmed" size="sm">
            Ends{" "}
            {formatDistanceToNow(new Date(giveaway.endTime), {
              addSuffix: true,
            })}
          </Text>
          <Group>
            <Badge color={giveaway.state === "OPEN" ? "green" : "red"}>
              {giveaway.state}
            </Badge>
            {isClosed && (
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  View summary
                </Text>
                <IconInfoCircle size={16} style={{ opacity: 0.5 }} />
              </Group>
            )}
          </Group>
        </Stack>
      </Card>
    </Anchor>
  );
}

export default function GuildGiveaways({ loaderData }: Route.ComponentProps) {
  const { loggedIn, guild, giveaways } = loaderData;
  const navigate = useNavigate();

  if (!loggedIn || !guild) {
    return <NotLoggedIn />;
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Button
          onClick={() => navigate(-1)}
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          size="md"
          style={{ alignSelf: "flex-start", marginBottom: 8, padding: 0 }}
        >
          Back
        </Button>
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
              <GiveawayCard key={g.messageId} giveaway={g} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
