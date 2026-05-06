import type { EditModalTranslations } from "@dougley/frugal-utils";
import {
  getGiveawayTranslations as sharedGetGiveawayTranslations,
  getJoinButtonTranslations as sharedGetJoinButtonTranslations,
} from "@dougley/frugal-utils";
import { getContext } from "../context";

export async function getGiveawayTranslations(
  locale: string,
  counts: { participants: number; winners: number }
) {
  const { i18n } = getContext();
  return sharedGetGiveawayTranslations(i18n, locale, counts);
}

export async function getJoinButtonTranslations(locale: string) {
  const { i18n } = getContext();
  return sharedGetJoinButtonTranslations(i18n, locale);
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
