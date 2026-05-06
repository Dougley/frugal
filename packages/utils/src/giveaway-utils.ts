import type { I18n } from "@dougley/frugal-i18n";
import type translations from "@dougley/frugal-i18n/locales/en-US";
import {
  type AnyComponent,
  type ComponentActionRow,
  ComponentType,
} from "slash-create/web";

type AppTranslations = typeof translations;

// Constants
export const PARTY_POPPER_EMOJI = "🎉";
export const GIFT_EMOJI = "🎁";
export const TROPHY_EMOJI = "🏆";
export const GIVEAWAY_COLOR = 0x00bfff;

const DEFAULT_TRANSLATIONS = {
  title: "UNTRANSLATED [Giveaway]",
  titleEnded: "UNTRANSLATED [Giveaway ended!]",
  winners: "UNTRANSLATED [Winners]",
  ends: "UNTRANSLATED [Ends]",
  ended: "UNTRANSLATED [Ended]",
  hostedBy: "UNTRANSLATED [Hosted by]",
  descriptionNote: "UNTRANSLATED [Description provided by the host]",
  prize: "UNTRANSLATED [Prize]",
  entries: "UNTRANSLATED [Entries]",
  enterCta: "UNTRANSLATED [Click the button below to enter!]",
  participants: "UNTRANSLATED [participants]",
  winnerCount: "UNTRANSLATED [winners]",
};

/**
 * Translation strings for giveaway embeds and components.
 *
 * All strings should be fully-formatted and ready for display.
 * Use your i18n system to apply proper pluralization before passing.
 */
export type GiveawayTranslations = Partial<typeof DEFAULT_TRANSLATIONS>;

/**
 * Merges provided translations with defaults
 */
function getTranslations(
  translations?: GiveawayTranslations
): Required<GiveawayTranslations> {
  if (!translations) return DEFAULT_TRANSLATIONS;
  return { ...DEFAULT_TRANSLATIONS, ...translations };
}

/**
 * Creates a Discord message embed for a giveaway
 *
 * @param giveaway - Giveaway data for the embed
 * @param entriesCount - Number of entries (default: 0)
 * @param isOpen - Whether the giveaway is still open (default: true)
 * @param translations - Optional i18n translations. For count-based strings
 *   (`participants`, `winnerCount`), pass fully-formatted strings with
 *   pluralization already applied by your i18n system.
 */
export const createGiveawayEmbed = (
  giveaway: {
    prize: string;
    description?: string | null;
    end_time: Date;
    host_username: string;
    host_id: string;
    host_avatar?: string | null;
  },
  isOpen = true,
  translations?: GiveawayTranslations
) => {
  const timestamp = Math.floor(giveaway.end_time.getTime() / 1000);
  const t = getTranslations(translations);

  return {
    color: isOpen ? GIVEAWAY_COLOR : 0x99aab5,
    description: isOpen
      ? `${PARTY_POPPER_EMOJI} **${t.title.toUpperCase()}** ${PARTY_POPPER_EMOJI}\n${GIFT_EMOJI} **${t.prize}:** ${giveaway.prize}${giveaway.description ? `\n\n${giveaway.description}\n\n` : "\n\n"}*${t.enterCta}*\n\n`
      : `🎉 **${t.titleEnded}** 🎉\n\n${giveaway.description || ""}`,
    fields: isOpen
      ? [
          {
            name: `${TROPHY_EMOJI} ${t.winners}`,
            value: t.winnerCount,
            inline: true,
          },
          {
            name: `⏱️ ${t.ends}`,
            value: `<t:${timestamp}:R>\n<t:${timestamp}:F>`,
            inline: true,
          },
          {
            name: `👥 ${t.entries}`,
            value: t.participants,
            inline: true,
          },
        ]
      : [
          {
            name: `🎁 ${t.prize}`,
            value: giveaway.prize,
            inline: true,
          },
          {
            name: `🏆 ${t.winners}`,
            value: t.winnerCount,
            inline: true,
          },
          {
            name: `⏱️ ${t.ended}`,
            value: `<t:${timestamp}:R>\n<t:${timestamp}:F>`,
            inline: true,
          },
        ],
    footer: {
      text: `${t.hostedBy} ${giveaway.host_username}`,
      icon_url: giveaway.host_avatar
        ? `https://cdn.discordapp.com/avatars/${giveaway.host_id}/${giveaway.host_avatar}.png`
        : undefined,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Creates the component structure for a giveaway message
 *
 * @param params - Giveaway display parameters
 * @param params.translations - Optional i18n translations. For count-based strings,
 *   pass fully-formatted strings with pluralization already applied.
 */
export const createGiveawayComponents = (params: {
  prize: string;
  end_time: Date;
  host_username: string;
  host_id: string;
  description?: string;
  giveaway_id: string;
  join_button: ComponentActionRow;
  translations?: GiveawayTranslations;
}): AnyComponent[] => {
  const {
    prize,
    end_time,
    host_username,
    host_id,
    description,
    giveaway_id: _giveaway_id,
    join_button,
    translations: providedTranslations,
  } = params;

  const t = getTranslations(providedTranslations);

  const components = [
    {
      type: ComponentType.SECTION,
      accessory: {
        type: ComponentType.THUMBNAIL,
        media: {
          url: "https://giveawaybot.party/images/giveaway_ava_epic.png",
        },
      },
      components: [
        {
          type: ComponentType.TEXT_DISPLAY,
          content: `# ${PARTY_POPPER_EMOJI} ${t.title} ${PARTY_POPPER_EMOJI}`,
        },
        {
          type: ComponentType.TEXT_DISPLAY,
          content: `## **${prize}**`,
        },
      ],
    },
    ...(description
      ? [
          {
            type: ComponentType.CONTAINER,
            accent_color: 0x00ff00,
            components: [
              {
                type: ComponentType.TEXT_DISPLAY,
                content: `${description}`,
              },
              {
                type: ComponentType.TEXT_DISPLAY,
                content: `-# ${t.descriptionNote}`,
              },
            ],
          },
        ]
      : []),
    {
      type: ComponentType.CONTAINER,
      components: [
        {
          type: ComponentType.TEXT_DISPLAY,
          content: `### 🏆 ${t.winners}`,
        },
        {
          type: ComponentType.TEXT_DISPLAY,
          content: `### ⏱️ **${t.ends}** <t:${Math.floor(end_time.getTime() / 1000)}:R>`,
        },
      ],
    },
    join_button,
    {
      type: ComponentType.SEPARATOR,
    },
    {
      type: ComponentType.TEXT_DISPLAY,
      content: `-# ${t.hostedBy} ${host_username ? `${host_username} ` : ""}(<@${host_id}>)`,
    },
  ];

  return components as AnyComponent[];
};

/**
 * Fetch all giveaway embed translation strings for a given locale.
 * Accepts an explicit I18n instance so both the Discord bot and web worker
 * can share identical string resolution without coupling to either app's context.
 */
export async function getGiveawayTranslations(
  i18n: I18n<AppTranslations>,
  locale: string,
  counts: { participants: number; winners: number }
): Promise<Required<GiveawayTranslations>> {
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

/**
 * Fetch join-button translation strings for a given locale.
 */
export async function getJoinButtonTranslations(
  i18n: I18n<AppTranslations>,
  locale: string
): Promise<{ label: string }> {
  const label = await i18n.translate("components.join_button.label", {
    language: locale,
  });
  return { label };
}

/**
 * Creates the component structure for an ended giveaway message
 *
 * @param params - Ended giveaway display parameters
 * @param params.translations - Optional i18n translations. For count-based strings,
 *   pass fully-formatted strings with pluralization already applied.
 */
export const createEndedGiveawayComponents = (params: {
  prize: string;
  winners: number;
  end_time: Date;
  host_username: string;
  host_id: string;
  description?: string;
  giveaway_id: string;
  winners_list: string[];
  translations?: GiveawayTranslations;
}): unknown[] => {
  const {
    prize,
    end_time,
    host_username,
    host_id,
    description,
    giveaway_id: _giveaway_id,
    winners_list,
    translations: providedTranslations,
  } = params;

  const t = getTranslations(providedTranslations);

  const components = [
    {
      type: ComponentType.SECTION,
      accessory: {
        type: ComponentType.THUMBNAIL,
        media: {
          url: "https://giveawaybot.party/images/giveaway_ava_epic.png",
        },
      },
      components: [
        {
          type: ComponentType.TEXT_DISPLAY,
          content: `# ${PARTY_POPPER_EMOJI} ${t.titleEnded} ${PARTY_POPPER_EMOJI}`,
        },
        {
          type: ComponentType.TEXT_DISPLAY,
          content: `## **${prize}**`,
        },
      ],
    },
    ...(description
      ? [
          {
            type: ComponentType.CONTAINER,
            accent_color: 0x00ff00,
            components: [
              {
                type: ComponentType.TEXT_DISPLAY,
                content: `${description}`,
              },
              {
                type: ComponentType.TEXT_DISPLAY,
                content: `-# ${t.descriptionNote}`,
              },
            ],
          },
        ]
      : []),
    {
      type: ComponentType.CONTAINER,
      components: [
        {
          type: ComponentType.TEXT_DISPLAY,
          content: `### 🏆 ${t.winners}`,
        },
        {
          type: ComponentType.TEXT_DISPLAY,
          content: winners_list.join(", "),
        },
        {
          type: ComponentType.TEXT_DISPLAY,
          content: `### ⏱️ **${t.ended}** <t:${Math.floor(end_time.getTime() / 1000)}:R>`,
        },
      ],
    },
    {
      type: ComponentType.SEPARATOR,
    },
    {
      type: ComponentType.TEXT_DISPLAY,
      content: `-# ${t.hostedBy} ${host_username ? `${host_username} ` : ""}(<@${host_id}>)`,
    },
  ];

  return components;
};
