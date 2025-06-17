import {
  AnyComponent,
  ComponentActionRow,
  ComponentType,
} from "slash-create/web";

// Constants
export const PARTY_POPPER_EMOJI = "🎉";
export const GIFT_EMOJI = "🎁";
export const TROPHY_EMOJI = "🏆";
export const GIVEAWAY_COLOR = 0x00bfff;

/**
 * Creates a Discord message embed for a giveaway
 */
export const createGiveawayEmbed = (
  giveaway: {
    prize: string;
    winners: number;
    description?: string | null;
    end_time: Date;
    host_username: string;
    host_id: string;
    host_avatar?: string | null;
  },
  entriesCount = 0,
  isOpen = true,
) => {
  const timestamp = Math.floor(giveaway.end_time.getTime() / 1000);

  return {
    color: isOpen ? GIVEAWAY_COLOR : 0x99aab5,
    description: isOpen
      ? `${PARTY_POPPER_EMOJI} **GIVEAWAY!** ${PARTY_POPPER_EMOJI}\n${GIFT_EMOJI} **Prize:** ${giveaway.prize}${giveaway.description ? `\n\n${giveaway.description}\n\n` : "\n\n"}*Click the button below to enter!*\n\n`
      : `🎉 **Giveaway ended** 🎉\n\n${giveaway.description || ""}`,
    fields: isOpen
      ? [
          {
            name: `${TROPHY_EMOJI} Winners`,
            value: `**${giveaway.winners}** winner${giveaway.winners > 1 ? "s" : ""}`,
            inline: true,
          },
          {
            name: "⏱️ Ends",
            value: `<t:${timestamp}:R>\n<t:${timestamp}:F>`,
            inline: true,
          },
          {
            name: "👥 Entries",
            value: `**${entriesCount}** participant${entriesCount !== 1 ? "s" : ""}`,
            inline: true,
          },
        ]
      : [
          {
            name: "🎁 Prize",
            value: giveaway.prize,
            inline: true,
          },
          {
            name: "🏆 Winners",
            value: `**${giveaway.winners}** winner${giveaway.winners > 1 ? "s" : ""}`,
            inline: true,
          },
          {
            name: "⏱️ Ended",
            value: `<t:${timestamp}:R>\n<t:${timestamp}:F>`,
            inline: true,
          },
        ],
    footer: {
      text: `Hosted by ${giveaway.host_username}`,
      icon_url: giveaway.host_avatar
        ? `https://cdn.discordapp.com/avatars/${giveaway.host_id}/${giveaway.host_avatar}.png`
        : undefined,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Creates the component structure for a giveaway message
 */
export const createGiveawayComponents = (params: {
  prize: string;
  winners: number;
  end_time: Date;
  host_username: string;
  host_id: string;
  description?: string;
  giveaway_id: string;
  join_button: ComponentActionRow;
}): AnyComponent[] => {
  const {
    prize,
    winners,
    end_time,
    host_username,
    host_id,
    description,
    giveaway_id: _giveaway_id,
    join_button,
  } = params;

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
          content: `# ${PARTY_POPPER_EMOJI} Giveaway! ${PARTY_POPPER_EMOJI}`,
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
                content: `-# Description provided by the host`,
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
          content: `### 🏆 **${winners}** Winner${winners > 1 ? "s" : ""}`,
        },
        {
          type: ComponentType.TEXT_DISPLAY,
          content: `### ⏱️ **Ends** <t:${Math.floor(end_time.getTime() / 1000)}:R>`,
        },
      ],
    },
    join_button,
    {
      type: ComponentType.SEPARATOR,
    },
    {
      type: ComponentType.TEXT_DISPLAY,
      content: `-# Hosted by ${host_username} (<@${host_id}>)`,
    },
  ];

  return components as AnyComponent[];
};

export const createEndedGiveawayComponents = (params: {
  prize: string;
  winners: number;
  end_time: Date;
  host_username: string;
  host_id: string;
  description?: string;
  giveaway_id: string;
  winners_list: string[];
}): unknown[] => {
  const {
    prize,
    winners,
    end_time,
    host_username,
    host_id,
    description,
    giveaway_id: _giveaway_id,
    winners_list,
  } = params;

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
          content: `# ${PARTY_POPPER_EMOJI} Giveaway ended! ${PARTY_POPPER_EMOJI}`,
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
                content: `-# Description provided by the host`,
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
          content: `### 🏆 **${winners}** Winner${winners > 1 ? "s" : ""}`,
        },
        {
          type: ComponentType.TEXT_DISPLAY,
          content: winners_list.join(", "),
        },
        {
          type: ComponentType.TEXT_DISPLAY,
          content: `### ⏱️ **Ended** <t:${Math.floor(end_time.getTime() / 1000)}:R>`,
        },
      ],
    },
    {
      type: ComponentType.SEPARATOR,
    },
    {
      type: ComponentType.TEXT_DISPLAY,
      content: `-# Hosted by ${host_username} (<@${host_id}>)`,
    },
  ];

  return components;
};
