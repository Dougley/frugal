/// <reference types="@dougley/types/summaries" />

import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconDownload, IconTrash } from "@tabler/icons-react";
import { add, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router";
import ParticipantsTable from "~/components/ParticipantsTable/ParticipantsTable";
import WinnersTable from "~/components/WinnersTable/WinnersTable";
import type { Route } from "./+types/giveaways.summaries.$summaryId";

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const bucket = context.cloudflare.env.STORAGE;
  const url = new URL(request.url);
  const cacheKey = new Request(url.toString(), request);
  const id = params.summaryId;

  // @ts-expect-error - this is how cf suggests to do it, ts hates it
  const cache = context.cloudflare.caches.default as Cache;

  // Check if the request is already in the cache
  const cached = await cache.match(cacheKey);
  if (cached) {
    console.log(
      `Cache hit for ${id} with etag ${cached.headers.get("etag")}, and url ${url.toString()}`
    );
    return {
      json: await cached.json(),
      headers: cached.headers,
    };
  }

  const obj = await bucket.head(`giveaway-${id}.json`);
  if (obj === null) {
    console.log(
      `Cache miss for ${id} with url ${url.toString()}, but not found in bucket.`
    );
    throw new Response("Not found", { status: 404 });
  }

  const data = await bucket.get(`giveaway-${id}.json`);
  console.log(
    `Cache miss for ${id} with url ${url.toString()}, but found in bucket.`
  );

  const headers = new Headers();
  data!.writeHttpMetadata(headers);
  headers.set("etag", data!.etag);
  // Cache for 3 months, which is the default expiry for everything
  headers.set("cache-control", "public, max-age=7776000");

  const json = await data!.json();

  cache.put(cacheKey, new Response(JSON.stringify(json), { headers }));

  return {
    json,
    headers,
  };
}

function downloadFile(data: SummaryOutput) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", `${data.details.message}.json`);
  a.setAttribute("target", "_blank");
  a.click();
}

interface LoaderData {
  json: SummaryOutput;
  headers: Headers;
}

export default function SummaryPage({
  loaderData,
}: {
  loaderData: LoaderData;
}) {
  const data = loaderData.json;
  const navigate = useNavigate();

  return (
    <Container size="lg">
      <Stack gap={40} align="start" py="xl">
        <Paper radius="md" w="100%">
          <Group justify="space-between" align="center" w="100%" mb={16}>
            <Button
              onClick={() => navigate(-1)}
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              size="md"
            >
              Back
            </Button>
            <Group align="center">
              <Button
                onClick={() => downloadFile(data)}
                leftSection={<IconDownload size={16} />}
                variant="light"
                size="md"
              >
                Download
              </Button>
              <Button
                color="red"
                variant="light"
                leftSection={<IconTrash size={16} />}
                size="md"
              >
                Delete
              </Button>
            </Group>
          </Group>
          <Title order={1} size="h2" fw={700} mb={8}>
            Giveaway Summary
          </Title>
          <Text size="xl" fw={500} c="blue.6" mb={2}>
            Prize: {data.details.prize}
          </Text>
          <Text size="sm" c="dimmed" mb={8}>
            Summary expires{" "}
            {formatDistanceToNow(
              add(new Date(data.details.time.end), { days: 90 }),
              { addSuffix: true }
            )}
          </Text>
          <Divider my={12} />
        </Paper>

        <Flex w="100%" gap={32} wrap="wrap" justify="space-between">
          <Box flex={1}>
            <WinnersTable
              winners={data.entries.filter((entry) =>
                data.details.originalWinners.includes(entry.id)
              )}
            />
          </Box>
          <Box flex={1}>
            <ParticipantsTable participants={data.entries} />
          </Box>
        </Flex>
      </Stack>
    </Container>
  );
}
