import {
  Alert,
  Anchor,
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
  IconCrown,
  IconInfoCircle,
  IconTrophy,
  IconX,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

  const rerollConfigQuery = useQuery({
    ...trpc.giveaways.getRerollConfig.queryOptions({
      giveawayId: giveaway.durableObjectId,
    }),
    enabled: opened,
  });

  const maxRerollCount = rerollConfigQuery.data?.maxRerollCount ?? 1;
  const isPremium = rerollConfigQuery.data?.isPremium ?? false;
  const isConfigReady = rerollConfigQuery.isSuccess;

  const [premiumRequired, setPremiumRequired] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setPremiumRequired(false);
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    setCount((current) => Math.min(current, maxRerollCount));
  }, [opened, maxRerollCount]);

  const showBulkRerollUpsell = isConfigReady && !isPremium;
  const isCountLocked = !isConfigReady || !isPremium;

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
          color: "lime",
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
        const message = error.message;
        const isPremiumRequiredError =
          error.data?.code === "FORBIDDEN" &&
          typeof message === "string" &&
          message.startsWith("402");

        if (isPremiumRequiredError) {
          setPremiumRequired(true);
          return;
        }

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
    setPremiumRequired(false);

    const rerollCount = Math.min(count, maxRerollCount);
    rerollMutation.mutate({
      giveawayId: giveaway.durableObjectId,
      count: rerollCount,
    });
  };

  const handleClose = () => {
    setPremiumRequired(false);
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
              color="indigo"
              variant="light"
            >
              {t("giveaways.modals.reroll.note")}
            </Alert>

            {showBulkRerollUpsell && (
              <Alert
                icon={<IconCrown size={16} aria-hidden="true" />}
                color="yellow"
                variant={premiumRequired ? "filled" : "light"}
              >
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    {t("giveaways.modals.reroll.freeLimitTitle")}
                  </Text>
                  <Text size="sm">
                    {t("giveaways.modals.reroll.freeLimitMessage")}
                  </Text>
                  <Anchor
                    component={Link}
                    to="/premium"
                    underline="always"
                    size="sm"
                  >
                    {t("giveaways.modals.reroll.freeLimitAction")}
                  </Anchor>
                </Stack>
              </Alert>
            )}

            <NumberInput
              label={t("giveaways.modals.reroll.countLabel")}
              description={t("giveaways.modals.reroll.countDescription")}
              min={1}
              max={maxRerollCount}
              disabled={isCountLocked}
              value={count}
              onChange={(value) => {
                const nextValue = Number(value) || 1;
                setPremiumRequired(false);
                setCount(Math.min(nextValue, maxRerollCount));
              }}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleReroll}
                loading={rerollMutation.isPending}
                disabled={!isConfigReady || rerollConfigQuery.isLoading}
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
                    .map((winner) => {
                      const displayName =
                        winner.username ?? t("common.unknown");
                      const mention = winner.id ? `<@${winner.id}>` : "";
                      return [displayName, mention].filter(Boolean).join(" ");
                    })
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
                        color={copied ? "lime" : "indigo"}
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
              {newWinners.map((winner, index) => (
                <Paper
                  key={winner.id ?? winner.username ?? String(index)}
                  p="sm"
                  withBorder
                >
                  <Group>
                    <Avatar
                      src={
                        winner.avatar && winner.id
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
                        {winner.id ?? t("common.unknown")}
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
