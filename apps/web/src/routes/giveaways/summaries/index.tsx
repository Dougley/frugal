/// <reference types="@dougley/types/summaries" />

import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import {
  IconArrowLeft,
  IconDownload,
  IconFileUpload,
  IconInfoCircle,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { GiveawayStats } from "~/components/GiveawayStats";
import ParticipantsTable from "~/components/ParticipantsTable/ParticipantsTable";
import WinnersTable from "~/components/WinnersTable/WinnersTable";
import { useLocalizedDayjs } from "~/lib/dayjs";
import { createMeta } from "~/utils/seo";

/**
 * Summaries upload route - client-side only parsing
 *
 * No auth required - users can upload and view any summary JSON file.
 */
export const Route = createFileRoute("/giveaways/summaries/")({
  head: () => ({
    meta: createMeta({
      title: "View Giveaway Summary",
      description:
        "Upload and view giveaway summary files. See winners, participants, and giveaway details.",
      url: "/giveaways/summaries",
    }),
  }),
  component: SummariesUploadRoute,
});

// Zod schema for validating summary JSON files
const summarySchema = z.object({
  _version: z.literal(2),
  details: z.object({
    channel: z.string(),
    message: z.string(),
    prize: z.string(),
    winners: z.number(),
    originalWinners: z.array(z.string()),
    time: z.object({
      start: z.string(),
      end: z.string(),
    }),
  }),
  entries: z.array(
    z.object({
      id: z.string(),
      username: z.string(),
      discriminator: z.string().nullable(),
      avatar: z.string().nullable(),
    })
  ),
});

type SummaryData = z.infer<typeof summarySchema>;

function downloadFile(data: SummaryData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", `${data.details.message}.json`);
  a.setAttribute("target", "_blank");
  a.click();
  URL.revokeObjectURL(url);
}

interface SummaryDisplayProps {
  data: SummaryData;
  onClear: () => void;
}

function SummaryDisplay({ data, onClear }: SummaryDisplayProps) {
  const { t } = useTranslation();
  const dayjs = useLocalizedDayjs();

  const endTime = dayjs(data.details.time.end);
  const startTime = dayjs(data.details.time.start);
  const totalParticipants = data.entries.length;
  const winnersCount = data.details.originalWinners.length;

  const winners = data.entries.filter((entry) =>
    data.details.originalWinners.includes(entry.id)
  );

  return (
    <Stack gap="xl" py="xl">
      <Group justify="space-between" align="center">
        <Button
          onClick={onClear}
          variant="subtle"
          leftSection={<IconArrowLeft size={16} aria-hidden="true" />}
        >
          {t("summaries.uploadAnother")}
        </Button>

        <Button
          onClick={() => downloadFile(data)}
          leftSection={<IconDownload size={16} aria-hidden="true" />}
          variant="filled"
        >
          {t("common.download")}
        </Button>
      </Group>

      <Paper p="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={2} mb="xs">
                {data.details.prize}
              </Title>
              <Text c="dimmed" size="sm">
                {t("summaries.expiresIn", {
                  time: endTime.add(90, "days").fromNow(),
                })}
              </Text>
            </div>
            <Badge size="lg" variant="light" color="gray">
              {t("giveaways.status.closed")}
            </Badge>
          </Group>

          <Divider />

          <GiveawayStats
            winnersCount={winnersCount}
            participantsCount={totalParticipants}
            endTime={endTime}
            isEnded={true}
          />

          <Box>
            <Group justify="space-between" mb={4}>
              <Text size="xs" c="dimmed">
                {t("summaries.ranFrom", {
                  start: startTime.format("MMM D, YYYY"),
                  end: endTime.format("MMM D, YYYY"),
                })}
              </Text>
            </Group>
          </Box>
        </Stack>
      </Paper>

      {/* Winners and Participants Tables */}
      <Group gap="xl" align="flex-start" grow>
        <Box>
          <WinnersTable winners={winners} />
        </Box>
        <Box>
          <ParticipantsTable participants={data.entries} />
        </Box>
      </Group>
    </Stack>
  );
}

function SummariesUploadRoute() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleDrop = async (files: File[]) => {
    setError(null);

    if (files.length === 0) {
      return;
    }

    const file = files[0];

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = summarySchema.safeParse(json);

      if (!parsed.success) {
        setError(
          t("summaries.invalidSummaryFile", {
            error: parsed.error.issues[0].message,
          })
        );
        return;
      }

      setSummary(parsed.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.unexpected"));
    }
  };

  const handleReject = () => {
    setError(t("summaries.invalidFileType"));
  };

  if (summary) {
    return (
      <Container size="lg">
        <SummaryDisplay data={summary} onClear={() => setSummary(null)} />
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack gap="md">
          <Title order={1}>{t("summaries.title")}</Title>
          <Text c="dimmed">{t("summaries.description")}</Text>
        </Stack>

        {error && (
          <Alert
            icon={<IconInfoCircle aria-hidden="true" />}
            color="red"
            variant="light"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        <Dropzone
          onDrop={handleDrop}
          onReject={handleReject}
          maxSize={5 * 1024 * 1024} // 5MB
          accept={["application/json"]}
          multiple={false}
        >
          <Group
            justify="center"
            gap="xl"
            mih={220}
            style={{ pointerEvents: "none" }}
          >
            <Dropzone.Accept>
              <IconUpload size={52} stroke={1.5} aria-hidden="true" />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={52} stroke={1.5} aria-hidden="true" />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFileUpload size={52} stroke={1.5} aria-hidden="true" />
            </Dropzone.Idle>

            <div>
              <Text size="xl" inline>
                {t("summaries.dropzoneText")}
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                {t("summaries.dropzoneHelp")}
              </Text>
            </div>
          </Group>
        </Dropzone>
      </Stack>
    </Container>
  );
}
