import type {
  APIApplicationCommandInteraction,
  APIBaseInteraction,
  APIMessageComponentInteraction,
  APIModalSubmitInteraction,
  APIUser,
  InteractionType,
} from "discord-api-types/v10";

export interface TestUser extends Partial<APIUser> {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

export const DEFAULT_TEST_USER: TestUser = {
  id: "000000000000000001",
  username: "TestUser",
  discriminator: "0",
  avatar: null,
  global_name: "Test User",
  locale: "en-US",
};

export const DEFAULT_TEST_GUILD_ID = "000000000000000002";
export const DEFAULT_TEST_CHANNEL_ID = "000000000000000003";
export const DEFAULT_TEST_APP_ID = "000000000000000004";

export function buildPingInteraction(appId = DEFAULT_TEST_APP_ID) {
  return {
    id: crypto.randomUUID(),
    application_id: appId,
    type: 1 as InteractionType.Ping,
    token: crypto.randomUUID().replace(/-/g, ""),
    version: 1,
    app_permissions: "0",
    locale: "en-US",
    entitlements: [],
    authorizing_integration_owners: {},
    attachment_size_limit: 0,
  } as unknown as APIBaseInteraction<InteractionType.Ping, never> & {
    version: number;
    token: string;
  };
}

export function buildCommandInteraction(options: {
  commandName: string;
  commandId?: string;
  options?: Array<{
    name: string;
    type: number;
    value: string | number | boolean;
  }>;
  user?: Partial<TestUser>;
  guildId?: string;
  channelId?: string;
  appId?: string;
  permissions?: string;
}) {
  const user = { ...DEFAULT_TEST_USER, ...options.user } as APIUser;
  const guildId = options.guildId ?? DEFAULT_TEST_GUILD_ID;
  const channelId = options.channelId ?? DEFAULT_TEST_CHANNEL_ID;
  const appId = options.appId ?? DEFAULT_TEST_APP_ID;

  return {
    id: crypto.randomUUID(),
    application_id: appId,
    type: 2 as const,
    data: {
      id: options.commandId ?? crypto.randomUUID(),
      name: options.commandName,
      type: 1,
      options: options.options,
    },
    guild_id: guildId,
    channel_id: channelId,
    member: {
      user,
      roles: [],
      permissions: options.permissions ?? "2147483648",
      joined_at: new Date().toISOString(),
    },
    token: crypto.randomUUID().replace(/-/g, ""),
    version: 1,
    app_permissions: options.permissions ?? "2147483648",
    locale: "en-US",
    entitlements: [],
    authorizing_integration_owners: {},
    attachment_size_limit: 0,
  } as unknown as APIApplicationCommandInteraction;
}

export function buildComponentInteraction(options: {
  customId: string;
  componentType: number;
  messageId: string;
  user?: Partial<TestUser>;
  guildId?: string;
  channelId?: string;
  appId?: string;
  messageContent?: string;
}) {
  const user = { ...DEFAULT_TEST_USER, ...options.user } as APIUser;
  const guildId = options.guildId ?? DEFAULT_TEST_GUILD_ID;
  const channelId = options.channelId ?? DEFAULT_TEST_CHANNEL_ID;
  const appId = options.appId ?? DEFAULT_TEST_APP_ID;

  return {
    id: crypto.randomUUID(),
    application_id: appId,
    type: 3 as const,
    data: {
      custom_id: options.customId,
      component_type: options.componentType,
    },
    guild_id: guildId,
    channel_id: channelId,
    message: {
      id: options.messageId,
      channel_id: channelId,
      author: { id: appId },
      content: options.messageContent ?? "",
      timestamp: new Date().toISOString(),
      edited_timestamp: null,
      tts: false,
      mention_everyone: false,
      mentions: [],
      mention_roles: [],
      attachments: [],
      embeds: [],
      pinned: false,
      type: 0,
    },
    member: {
      user,
      roles: [],
      permissions: "2147483648",
      joined_at: new Date().toISOString(),
    },
    token: crypto.randomUUID().replace(/-/g, ""),
    version: 1,
    app_permissions: "2147483648",
    locale: "en-US",
    entitlements: [],
    authorizing_integration_owners: {},
    attachment_size_limit: 0,
  } as unknown as APIMessageComponentInteraction;
}

export function buildModalInteraction(options: {
  customId: string;
  components: Array<{
    customId: string;
    value: string;
  }>;
  user?: Partial<TestUser>;
  guildId?: string;
  channelId?: string;
  appId?: string;
  messageId?: string;
}) {
  const user = { ...DEFAULT_TEST_USER, ...options.user } as APIUser;
  const guildId = options.guildId ?? DEFAULT_TEST_GUILD_ID;
  const channelId = options.channelId ?? DEFAULT_TEST_CHANNEL_ID;
  const appId = options.appId ?? DEFAULT_TEST_APP_ID;

  return {
    id: crypto.randomUUID(),
    application_id: appId,
    type: 5 as const,
    data: {
      custom_id: options.customId,
      components: options.components.map((comp) => ({
        type: 1,
        components: [
          {
            type: 4,
            custom_id: comp.customId,
            value: comp.value,
          },
        ],
      })),
    },
    guild_id: guildId,
    channel_id: channelId,
    message: options.messageId
      ? {
          id: options.messageId,
          channel_id: channelId,
          author: { id: appId },
          content: "",
          timestamp: new Date().toISOString(),
          edited_timestamp: null,
          tts: false,
          mention_everyone: false,
          mentions: [],
          mention_roles: [],
          attachments: [],
          embeds: [],
          pinned: false,
          type: 0,
        }
      : undefined,
    member: {
      user,
      roles: [],
      permissions: "2147483648",
      joined_at: new Date().toISOString(),
    },
    token: crypto.randomUUID().replace(/-/g, ""),
    version: 1,
    app_permissions: "2147483648",
    locale: "en-US",
    entitlements: [],
    authorizing_integration_owners: {},
    attachment_size_limit: 0,
  } as unknown as APIModalSubmitInteraction;
}
