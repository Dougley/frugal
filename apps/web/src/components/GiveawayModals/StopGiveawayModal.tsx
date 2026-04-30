import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTRPC } from "~/server/trpc/client";

interface StopGiveawayModalProps {
  opened: boolean;
  onClose: () => void;
  giveaway: {
    durableObjectId: string;
    prize: string;
  };
  /** Guild ID for query invalidation. Optional when guild context is unavailable. */
  guildId?: string;
}

export function StopGiveawayModal({
  opened,
  onClose,
  giveaway,
  guildId,
}: StopGiveawayModalProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const stopMutation = useMutation(
    trpc.giveaways.stopGiveaway.mutationOptions({
      onSuccess: () => {
        notifications.show({
          title: t("giveaways.modals.stop.success.title"),
          message: t("giveaways.modals.stop.success.message"),
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
          queryKey: trpc.giveaways.getDetails.queryKey({
            giveawayId: giveaway.durableObjectId,
          }),
        });
        onClose();
      },
      onError: (error) => {
        notifications.show({
          title: t("giveaways.modals.stop.error.title"),
          message: error.message,
          icon: <IconX size={16} />,
          color: "red",
        });
      },
    })
  );

  const handleConfirm = () => {
    stopMutation.mutate({
      giveawayId: giveaway.durableObjectId,
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("giveaways.modals.stop.title")}
      size="md"
    >
      <Stack gap="md">
        <Alert
          icon={<IconAlertTriangle size={16} aria-hidden="true" />}
          color="orange"
          variant="light"
        >
          {t("giveaways.modals.stop.warning")}
        </Alert>

        <Text>
          {t("giveaways.modals.stop.confirmMessage", { prize: giveaway.prize })}
        </Text>

        <Text size="sm" c="dimmed">
          {t("giveaways.modals.stop.explanation")}
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            color="red"
            onClick={handleConfirm}
            loading={stopMutation.isPending}
          >
            {t("giveaways.modals.stop.confirmButton")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
