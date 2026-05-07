export function createTestGiveaway(
  overrides?: Partial<{
    messageId: string;
    channelId: string;
    guildId: string;
    prize: string;
    winners: number;
    endTime: string;
    hostId: string;
    hostUsername: string;
    state: string;
    durableObjectId: string;
    description: string | null;
    entryCount: number;
    locale: string;
  }>
) {
  return {
    messageId: "000000000000000100",
    channelId: "000000000000000003",
    guildId: "000000000000000002",
    prize: "Test Prize",
    winners: 1,
    endTime: new Date(Date.now() + 3600000).toISOString(),
    hostId: "000000000000000001",
    hostUsername: "TestHost",
    state: "OPEN",
    durableObjectId: crypto.randomUUID(),
    description: null,
    entryCount: 0,
    locale: "en-US",
    ...overrides,
  };
}

export function createTestEntry(
  overrides?: Partial<{
    userId: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    winner: boolean;
  }>
) {
  return {
    userId: `user-${Math.random().toString(36).slice(2, 8)}`,
    username: "TestUser",
    discriminator: "0",
    avatar: null,
    winner: false,
    ...overrides,
  };
}
