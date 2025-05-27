import { eq, inArray } from "@dougley/frugal-drizzle/workers";
import * as Schema from "@dougley/frugal-drizzle/workers/schema.js";
import {
  Alert,
  Anchor,
  Avatar,
  Badge,
  Card,
  Code,
  Collapse,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { IconChevronDown, IconInfoCircle } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { PermissionFlagsBits } from "discord-api-types/v10";
import { BitField } from "discord-bitflag";
import React from "react";
import { Link } from "react-router";
import { NotLoggedIn } from "~/components/NotLoggedIn/NotLoggedIn";
import { getLoggedInUser } from "~/utils/auth";
import type { Route } from "./+types/giveaways._index";

export async function loader({ context, request }: Route.LoaderArgs) {
  const currentUser = await getLoggedInUser(request, context);
  if (!currentUser) {
    return {
      loggedIn: false,
      guilds: [],
      hostedGiveaways: [],
    };
  }

  // First get all guilds with ManageEvents permission
  const eligibleGuilds = currentUser.guilds.filter((guild) =>
    new BitField(BigInt(guild.permissions)).has(
      PermissionFlagsBits.ManageEvents,
    ),
  );

  // Get all giveaways for these guilds
  const allGiveaways = await context.drizzle.query.giveaways.findMany({
    where: inArray(
      Schema.giveaways.guildId,
      eligibleGuilds.map((guild) => guild.id),
    ),
  });

  // Get hosted giveaways
  const hostedGiveaways = await context.drizzle.query.giveaways.findMany({
    where: eq(Schema.giveaways.hostId, currentUser.id),
  });

  // Filter guilds to only those that have giveaways
  const guildsWithGiveaways = eligibleGuilds.filter((guild) =>
    allGiveaways.some((g) => g.guildId === guild.id),
  );

  return {
    loggedIn: true,
    guilds: guildsWithGiveaways,
    hostedGiveaways,
  };
}

function GuildCard({
  guild,
}: {
  guild: { id: string; name: string; icon: string | null };
}) {
  const { hovered, ref } = useHover();

  return (
    <Anchor component={Link} to={`/giveaways/${guild.id}`} underline="never">
      <Card
        ref={ref}
        shadow="sm"
        radius="md"
        withBorder
        style={{
          transition: "all 0.2s ease",
          cursor: "pointer",
          transform: hovered ? "translateY(-2px)" : "none",
          boxShadow: hovered ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "none",
        }}
      >
        <Group>
          <Avatar
            src={
              guild.icon
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                : undefined
            }
            alt={guild.name}
            size="lg"
          >
            <Text>{guild.name.charAt(0)}</Text>
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text fw={500} size="lg">
              {guild.name}
            </Text>
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                View giveaways
              </Text>
              <IconInfoCircle size={16} style={{ opacity: 0.5 }} />
            </Group>
          </div>
        </Group>
      </Card>
    </Anchor>
  );
}

function GuildHostedGiveaways({
  guildId,
  giveaways,
  guilds,
}: {
  guildId: string;
  giveaways: any[];
  guilds: Array<{ id: string; name: string; icon: string | null }>;
}) {
  const [isOpen, setIsOpen] = React.useState(true);
  const guild = guilds.find((g) => g.id === guildId);

  return (
    <div>
      <UnstyledButton
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: "100%" }}
      >
        <Group mb="xs">
          <Avatar
            src={
              guild?.icon
                ? `https://cdn.discordapp.com/icons/${guildId}/${guild.icon}.png`
                : undefined
            }
            alt={guild?.name || guildId}
            size="sm"
          >
            {guild?.name.charAt(0)}
          </Avatar>
          <Title order={3} size="h4" style={{ flex: 1 }}>
            {guild?.name || guildId}
          </Title>
          <IconChevronDown
            size={20}
            style={{
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          />
        </Group>
      </UnstyledButton>
      <Collapse in={isOpen}>
        <SimpleGrid
          cols={{ base: 1, sm: 2, md: 3 }}
          spacing="lg"
          verticalSpacing="lg"
          style={{ minHeight: giveaways.length === 0 ? 0 : undefined }}
        >
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
      </Collapse>
    </div>
  );
}

export default function GiveawaysIndex({ loaderData }: Route.ComponentProps) {
  const { loggedIn, guilds, hostedGiveaways } = loaderData;

  if (!loggedIn) {
    return <NotLoggedIn />;
  }

  // Helper to group giveaways by guildId
  function groupByGuild<T extends { guildId: string }>(
    giveaways: T[],
  ): Record<string, T[]> {
    return giveaways.reduce<Record<string, T[]>>((acc, g) => {
      if (!acc[g.guildId]) acc[g.guildId] = [];
      acc[g.guildId].push(g);
      return acc;
    }, {});
  }

  const hostedByGuild = groupByGuild(hostedGiveaways);

  return (
    <Container size="lg" py="lg">
      <Stack gap="xl">
        <Title order={1}>Giveaways</Title>

        <section>
          <Title order={2} size="h3" mb="md">
            Your Guilds
          </Title>
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue" mb="md">
            Guilds must be hosting a giveaway to be shown here, and you must
            have the <Code>ManageEvents</Code> permission in the guild.
          </Alert>
          {guilds.length === 0 ? (
            <Text c="dimmed">
              There's nothing here yet, go host a giveaway!
            </Text>
          ) : (
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3 }}
              spacing="lg"
              verticalSpacing="lg"
            >
              {guilds.map((guild) => (
                <GuildCard key={guild.id} guild={guild} />
              ))}
            </SimpleGrid>
          )}
        </section>

        <section>
          <Title order={2} size="h3" mb="md">
            Giveaways you are hosting
          </Title>
          {Object.keys(hostedByGuild).length === 0 ? (
            <Text c="dimmed">
              There's nothing here yet, go host a giveaway!
            </Text>
          ) : (
            <Stack gap="lg">
              {Object.entries(hostedByGuild).map(([guildId, giveaways]) => (
                <GuildHostedGiveaways
                  key={guildId}
                  guildId={guildId}
                  giveaways={giveaways}
                  guilds={guilds}
                />
              ))}
            </Stack>
          )}
        </section>
      </Stack>
    </Container>
  );
}
