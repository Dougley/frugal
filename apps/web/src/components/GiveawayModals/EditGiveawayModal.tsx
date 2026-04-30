import {
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTRPC } from "~/server/trpc/client";

interface EditGiveawayModalProps {
  opened: boolean;
  onClose: () => void;
  giveaway: {
    durableObjectId: string;
    prize: string;
    winners: number;
    description?: string | null;
  };
  /** Guild ID for query invalidation. Optional when guild context is unavailable. */
  guildId?: string;
}

export function EditGiveawayModal({
  opened,
  onClose,
  giveaway,
  guildId,
}: EditGiveawayModalProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm({
    initialValues: {
      prize: giveaway.prize,
      winners: giveaway.winners,
      description: giveaway.description ?? "",
    },
    validate: {
      prize: (value) =>
        value.length < 1
          ? t("giveaways.modals.edit.validation.prizeRequired")
          : value.length > 100
            ? t("giveaways.modals.edit.validation.prizeTooLong")
            : null,
      winners: (value) =>
        value < 1
          ? t("giveaways.modals.edit.validation.winnersMin")
          : value > 50
            ? t("giveaways.modals.edit.validation.winnersMax")
            : null,
      description: (value) =>
        value && value.length > 1000
          ? t("giveaways.modals.edit.validation.descriptionTooLong")
          : null,
    },
  });

  const updateMutation = useMutation(
    trpc.giveaways.updateGiveaway.mutationOptions({
      onSuccess: () => {
        notifications.show({
          title: t("giveaways.modals.edit.success.title"),
          message: t("giveaways.modals.edit.success.message"),
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
          title: t("giveaways.modals.edit.error.title"),
          message: error.message,
          icon: <IconX size={16} />,
          color: "red",
        });
      },
    })
  );

  const handleSubmit = form.onSubmit((values) => {
    updateMutation.mutate({
      giveawayId: giveaway.durableObjectId,
      prize: values.prize,
      winners: values.winners,
      description: values.description || undefined,
    });
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("giveaways.modals.edit.title")}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label={t("giveaways.modals.edit.prizeLabel")}
            placeholder={t("giveaways.modals.edit.prizePlaceholder")}
            required
            {...form.getInputProps("prize")}
          />

          <NumberInput
            label={t("giveaways.modals.edit.winnersLabel")}
            placeholder="1"
            min={1}
            max={50}
            required
            {...form.getInputProps("winners")}
          />

          <Textarea
            label={t("giveaways.modals.edit.descriptionLabel")}
            placeholder={t("giveaways.modals.edit.descriptionPlaceholder")}
            autosize
            minRows={2}
            maxRows={4}
            {...form.getInputProps("description")}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              {t("common.save")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
