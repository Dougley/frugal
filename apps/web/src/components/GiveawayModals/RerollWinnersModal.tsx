import {
  Alert,
  Avatar,
  Button,
  CopyButton,
  Group,
  Modal,
  NumberInput,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconCopy,
  IconInfoCircle,
  IconTrophy,
  IconX,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTRPC } from "~/server/trpc/client";

interface RerollWinnersModalProps {
  opened: boolean;
  onClose: () => void;
  giveaway: {
    durableObjectId: string;
    prize: string;
    winners: number;
  };
  /** Guild ID for query invalidation. Optional when used from summary pages. */
  guildId?: string;
}

interface Winner {
  id: string | null;
  username: string | null;
  avatar: string | null;
}

export function RerollWinnersModal({
  opened,
  onClose,
  giveaway,
  guildId,
}: RerollWinnersModalProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [count, setCount] = useState<number>(1);
  const [newWinners, setNewWinners] = useState<Winner[] | null>(null);

  const rerollMutation = useMutation(
    trpc.giveaways.rerollWinners.mutationOptions({
      onSuccess: (data) => {
        setNewWinners(data.winners);
        notifications.show({
          title: t("giveaways.modals.reroll.success.title"),
          message: t("giveaways.modals.reroll.success.message", {
            count: data.winners.length,
          }),
          icon: <IconCheck size={16} />,
          color: "green",
        });
        // Invalidate queries to refresh the data
        if (guildId) {
          queryClient.invalidateQueries({
            queryKey: trpc.giveaways.getGuildGiveaways.queryKey({ guildId }),
          });
        }
        queryClient.invalidateQueries({
          queryKey: trpc.giveaways.getSummary.queryKey({
            summaryId: giveaway.durableObjectId,
          }),
        });
      },
      onError: (error) => {
        notifications.show({
          title: t("giveaways.modals.reroll.error.title"),
          message: error.message,
          icon: <IconX size={16} />,
          color: "red",
        });
      },
    })
  );

  const handleReroll = () => {
    rerollMutation.mutate({
      giveawayId: giveaway.durableObjectId,
      count,
    });
  };

  const handleClose = () => {
    setNewWinners(null);
    setCount(1);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t("giveaways.modals.reroll.title")}
      size="md"
    >
      <Stack gap="md">
        {!newWinners ? (
          <>
            <Text>
              {t("giveaways.modals.reroll.description", {
                prize: giveaway.prize,
              })}
            </Text>

            <Alert
              icon={<IconInfoCircle size={16} aria-hidden="true" />}
              color="blue"
              variant="light"
            >
              {t("giveaways.modals.reroll.note")}
            </Alert>

            <NumberInput
              label={t("giveaways.modals.reroll.countLabel")}
              description={t("giveaways.modals.reroll.countDescription")}
              min={1}
              max={50}
              value={count}
              onChange={(value) => setCount(Number(value) || 1)}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleReroll}
                loading={rerollMutation.isPending}
                leftSection={<IconTrophy size={16} aria-hidden="true" />}
              >
                {t("giveaways.modals.reroll.confirmButton")}
              </Button>
            </Group>
          </>
        ) : (
          <>
            <Group justify="space-between" align="center">
              <Text fw={500}>{t("giveaways.modals.reroll.newWinners")}</Text>
              {newWinners.length > 0 && (
                <CopyButton
                  value={newWinners
                    .map((w) => `${w.username} (<@${w.id}>)`)
                    .join("\n")}
                >
                  {({ copied, copy }) => (
                    <Tooltip
                      label={
                        copied
                          ? t("notifications.copied.title")
                          : t("giveaways.modals.reroll.copyHint")
                      }
                    >
                      <Button
                        variant="light"
                        size="xs"
                        leftSection={
                          copied ? (
                            <IconCheck size={14} aria-hidden="true" />
                          ) : (
                            <IconCopy size={14} aria-hidden="true" />
                          )
                        }
                        onClick={copy}
                        color={copied ? "green" : "blue"}
                      >
                        {copied
                          ? t("notifications.copied.title")
                          : t("giveaways.copyId")}
                      </Button>
                    </Tooltip>
                  )}
                </CopyButton>
              )}
            </Group>

            <Stack gap="xs">
              {newWinners.map((winner) => (
                <Paper key={winner.id} p="sm" withBorder>
                  <Group>
                    <Avatar
                      src={
                        winner.avatar
                          ? `https://cdn.discordapp.com/avatars/${winner.id}/${winner.avatar}.png`
                          : undefined
                      }
                      alt=""
                      size="sm"
                      radius="xl"
                    >
                      {winner.username?.charAt(0) ?? "?"}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500}>
                        {winner.username ?? t("common.unknown")}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {winner.id}
                      </Text>
                    </div>
                  </Group>
                </Paper>
              ))}
            </Stack>

            {newWinners.length === 0 && (
              <Text c="dimmed" ta="center">
                {t("giveaways.modals.reroll.noEligibleParticipants")}
              </Text>
            )}

            <Group justify="flex-end" mt="md">
              <Button onClick={handleClose}>{t("common.close")}</Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
