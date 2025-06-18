import {
  Alert,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { FileWithPath } from "@mantine/dropzone";
import { Dropzone } from "@mantine/dropzone";
import {
  IconAlertOctagon,
  IconFileUpload,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import type { ActionFunctionArgs } from "react-router";
import { useActionData } from "react-router";
import { z } from "zod";
import ParticipantsTable from "~/components/ParticipantsTable/ParticipantsTable";
import WinnersTable from "~/components/WinnersTable/WinnersTable";
import { defaultMeta } from "~/utils/meta";

export const meta = () => {
  return defaultMeta("Giveaway Summaries");
};

const summarySchema = z.object({
  _version: z.literal(2),
  details: z.object({
    channel: z.string(),
    message: z.string(),
    prize: z.string(),
    winners: z.number(),
    originalWinners: z.array(z.string()),
    time: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
  }),
  entries: z.array(
    z.object({
      id: z.string(),
      username: z.string(),
      discriminator: z.string(),
      avatar: z.nullable(z.string()),
    })
  ),
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.formData();
    const file = body.get("file") as File;

    if (!file || file.size === 0) {
      return { ok: false, error: "No file provided" };
    }

    const text = await file.text();
    const data = summarySchema.parse(JSON.parse(text));
    return { ok: true, data };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        ok: false,
        error: e.issues
          .map((i) => `"${i.path.join(".")}" - ${i.message}`)
          .join("\n"),
      };
    }
    if (e instanceof SyntaxError) {
      return { ok: false, error: "Invalid JSON" };
    }
    return { ok: false, error: "Invalid file" };
  }
}

export default function SummariesIndex() {
  const data = useActionData<typeof action>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<SummaryOutput | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileDrop = async (files: FileWithPath[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setParseError(null);
      setParsedData(null);

      try {
        const text = await file.text();
        const data = summarySchema.parse(JSON.parse(text));
        setParsedData(data);
      } catch (e) {
        if (e instanceof z.ZodError) {
          setParseError(
            e.issues
              .map((i) => `"${i.path.join(".")}" - ${i.message}`)
              .join("\n")
          );
        } else if (e instanceof SyntaxError) {
          setParseError("Invalid JSON");
        } else {
          setParseError("Invalid file");
        }
      }
    }
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={1}>Giveaway Summaries</Title>

        <Paper radius="md" p="xl" withBorder>
          <Stack gap="md">
            <Text>
              View comprehensive giveaway results by uploading a summary file.
              These files contain winner selections, participant lists, and
              verification data to ensure transparency.
            </Text>
            <Text size="sm" c="dimmed">
              Got a summary from a completed giveaway? Drop it here to explore
              the data.
            </Text>

            <Dropzone
              onDrop={handleFileDrop}
              onReject={(files) => console.log("rejected files", files)}
              maxSize={5 * 1024 ** 2}
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
                  <IconUpload
                    style={{
                      width: 52,
                      height: 52,
                      color: "var(--mantine-color-blue-6)",
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX
                    style={{
                      width: 52,
                      height: 52,
                      color: "var(--mantine-color-red-6)",
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconFileUpload
                    style={{
                      width: 52,
                      height: 52,
                      color: "var(--mantine-color-dimmed)",
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Idle>

                <div>
                  <Text size="xl" inline>
                    Drop summary file here
                  </Text>
                  <Text size="sm" c="dimmed" inline mt={7}>
                    JSON format, 5MB max
                  </Text>
                </div>
              </Group>
            </Dropzone>

            {selectedFile && (
              <Group>
                <Text size="sm" c="dimmed">
                  Loaded: {selectedFile.name}
                </Text>
              </Group>
            )}
          </Stack>
        </Paper>

        {parseError && (
          <Alert
            icon={<IconAlertOctagon size={16} />}
            title="File Error"
            color="red"
            variant="light"
          >
            <Text component="pre" style={{ whiteSpace: "pre-wrap" }}>
              {parseError}
            </Text>
            <Text size="sm" mt="xs">
              Make sure you&apos;re using a valid summary file. Contact the
              original sender if this file came from someone else.
            </Text>
          </Alert>
        )}

        {data && !data.ok && (
          <Alert
            icon={<IconAlertOctagon size={16} />}
            title="Upload Error"
            color="red"
            variant="light"
          >
            <Text component="pre" style={{ whiteSpace: "pre-wrap" }}>
              {data.error}
            </Text>
            <Text size="sm" mt="xs">
              The submitted file couldn&apos;t be processed. Double-check the
              file format and try again.
            </Text>
          </Alert>
        )}

        {(parsedData || (data?.ok && data.data)) && (
          <>
            <Divider />
            <Stack gap="xl">
              <Paper radius="md" p="xl" withBorder>
                <Stack gap="md">
                  <Title order={2}>Giveaway Summary</Title>
                  <Text size="xl" fw={500} c="blue.6">
                    Prize:{" "}
                    {parsedData?.details.prize || data?.data?.details.prize}
                  </Text>
                </Stack>
              </Paper>

              <Group grow align="flex-start">
                <WinnersTable
                  winners={(
                    parsedData?.entries ||
                    data?.data?.entries ||
                    []
                  ).filter((entry: SavedUserInformation) =>
                    (
                      parsedData?.details.originalWinners ||
                      data?.data?.details.originalWinners ||
                      []
                    ).includes(entry.id)
                  )}
                />
                <ParticipantsTable
                  participants={
                    parsedData?.entries || data?.data?.entries || []
                  }
                />
              </Group>
            </Stack>
          </>
        )}
      </Stack>
    </Container>
  );
}
