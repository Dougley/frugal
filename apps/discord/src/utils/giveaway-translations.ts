import type {
  EditModalTranslations,
  GiveawayTranslations,
  JoinButtonTranslations,
} from "@dougley/frugal-utils";
import { getContext } from "../context";

export async function getGiveawayTranslations(
  locale: string,
  counts: { participants: number; winners: number }
): Promise<GiveawayTranslations> {
  const { i18n } = getContext();
  const [
    title,
    titleEnded,
    winners,
    ends,
    ended,
    hostedBy,
    descriptionNote,
    prize,
    entries,
    enterCta,
    participants,
    winnerCount,
  ] = await Promise.all([
    i18n.translate("giveaway.embed.title", { language: locale }),
    i18n.translate("giveaway.embed.title_ended", { language: locale }),
    i18n.translate("giveaway.embed.winners", { language: locale }),
    i18n.translate("common.labels.ends", { language: locale }),
    i18n.translate("common.labels.ended", { language: locale }),
    i18n.translate("giveaway.embed.hosted_by", { language: locale }),
    i18n.translate("giveaway.embed.description_note", { language: locale }),
    i18n.translate("giveaway.embed.prize", { language: locale }),
    i18n.translate("giveaway.embed.entries", { language: locale }),
    i18n.translate("giveaway.embed.enter_cta", { language: locale }),
    i18n.translate("common.labels.participants", {
      language: locale,
      params: { count: counts.participants },
    }),
    i18n.translate("common.labels.winners", {
      language: locale,
      params: { count: counts.winners },
    }),
  ]);

  return {
    title,
    titleEnded,
    winners,
    ends,
    ended,
    hostedBy,
    descriptionNote,
    prize,
    entries,
    enterCta,
    participants,
    winnerCount,
  };
}

export async function getJoinButtonTranslations(
  locale: string
): Promise<JoinButtonTranslations> {
  const { i18n } = getContext();
  const label = await i18n.translate("components.join_button.label", {
    language: locale,
  });
  return { label };
}

export async function getEditModalTranslations(
  locale: string
): Promise<EditModalTranslations> {
  const { i18n } = getContext();
  const [buttonLabel, modalTitle, prizeLabel, winnersLabel, descriptionLabel] =
    await Promise.all([
      i18n.translate("components.edit_modal.button_label", {
        language: locale,
      }),
      i18n.translate("components.edit_modal.title", { language: locale }),
      i18n.translate("components.edit_modal.fields.prize", {
        language: locale,
      }),
      i18n.translate("components.edit_modal.fields.winners", {
        language: locale,
      }),
      i18n.translate("components.edit_modal.fields.description", {
        language: locale,
      }),
    ]);

  return {
    buttonLabel,
    modalTitle,
    prizeLabel,
    winnersLabel,
    descriptionLabel,
  };
}
