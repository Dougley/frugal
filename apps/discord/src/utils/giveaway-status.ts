import {
  ButtonStyle,
  type ComponentActionRow,
  type ComponentButton,
  ComponentType,
} from "slash-create/web";
import { getContext } from "../context";

export async function createEntryActionRow({
  giveawayId,
  locale,
  nextAction,
}: {
  giveawayId: string;
  locale: string | undefined;
  nextAction: "join" | "leave";
}): Promise<ComponentActionRow> {
  const { i18n } = getContext();
  const [joinLabel, leaveLabel] = await Promise.all([
    i18n.translate("components.join_button.label", { language: locale }),
    i18n.translate("components.join_button.leave_label", { language: locale }),
  ]);

  const entryButton: ComponentButton = {
    type: ComponentType.BUTTON,
    style: nextAction === "leave" ? ButtonStyle.DANGER : ButtonStyle.PRIMARY,
    label: nextAction === "leave" ? leaveLabel : joinLabel,
    custom_id: `giveaway_${nextAction}:${giveawayId}`,
  };

  return {
    type: ComponentType.ACTION_ROW,
    components: [entryButton],
  };
}

export async function createGiveawayStatusResponse({
  giveawayId,
  locale,
  state,
  userId,
  entries,
}: {
  giveawayId: string;
  locale: string | undefined;
  state: {
    prize: string;
    winners: number;
    endTime: string;
    state: string;
    hostId?: string | null;
  };
  userId: string;
  entries: { userId: string | null }[];
}) {
  const { i18n } = getContext();
  const isEntered = entries.some((entry) => entry.userId === userId);
  const isOpen = state.state === "OPEN";
  const timestamp = Math.floor(new Date(state.endTime).getTime() / 1000);

  const [status, entryStatus, hostLabel] = await Promise.all([
    i18n.translate(
      isOpen
        ? "commands.giveaway_status.status.open"
        : "commands.giveaway_status.status.closed",
      { language: locale }
    ),
    i18n.translate(
      isEntered
        ? "commands.giveaway_status.status.entered"
        : "commands.giveaway_status.status.not_entered",
      { language: locale }
    ),
    i18n.translate("giveaway.embed.hosted_by", { language: locale }),
  ]);

  const content = await i18n.translate(
    "commands.giveaway_status.messages.status",
    {
      language: locale,
      params: {
        prize: state.prize,
        status,
        entries: entries.length.toString(),
        winners: state.winners.toString(),
        endTime: `<t:${timestamp}:R>`,
        entryStatus,
        host: state.hostId ? `<@${state.hostId}>` : hostLabel,
      },
    }
  );

  return {
    content,
    ephemeral: true,
    components: isOpen
      ? [
          await createEntryActionRow({
            giveawayId,
            locale,
            nextAction: isEntered ? "leave" : "join",
          }),
        ]
      : [],
  };
}
