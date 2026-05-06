import { PermissionFlagsBits } from "discord-api-types/v10";
import type { GuildCommandPerms, GuildMember } from "~/server/auth/discord";

type OverrideEntry = { id: string; type: 1 | 2 | 3; permission: boolean };

function applyOverrides(
  overrides: OverrideEntry[],
  userId: string,
  memberRoles: string[],
  guildId: string
): boolean | null {
  // User-specific override has highest priority
  const userOverride = overrides.find((o) => o.type === 2 && o.id === userId);
  if (userOverride) return userOverride.permission;

  // Specific role overrides (not @everyone) — any matching grant wins
  const roleOverrides = overrides.filter(
    (o) => o.type === 1 && o.id !== guildId && memberRoles.includes(o.id)
  );
  if (roleOverrides.length > 0) {
    return roleOverrides.some((o) => o.permission);
  }

  // @everyone role override (id == guildId)
  const everyoneOverride = overrides.find(
    (o) => o.type === 1 && o.id === guildId
  );
  if (everyoneOverride) return everyoneOverride.permission;

  return null;
}

export type ResolvePermissionArgs = {
  userId: string;
  member: GuildMember | null;
  guildId: string;
  guildPermissions: string;
  applicationId: string;
  commandPerms: GuildCommandPerms[];
  commandName?: string;
  defaultPermBit: bigint;
};

/**
 * Resolve whether a user can perform a Discord command action.
 * Implements Discord's permission resolution algorithm:
 * 1. Administrator short-circuit → always allow
 * 2. Default member permissions check
 * 3. Application-wide integration override (id == applicationId)
 * 4. Per-command override (matched by command name)
 */
export function resolvePermission({
  userId,
  member,
  guildId,
  guildPermissions,
  applicationId,
  commandPerms,
  commandName,
  defaultPermBit,
}: ResolvePermissionArgs): boolean {
  const permBits = BigInt(guildPermissions);
  const memberRoles = member?.roles ?? [];

  // Administrator always passes
  if (
    (permBits & PermissionFlagsBits.Administrator) ===
    PermissionFlagsBits.Administrator
  ) {
    return true;
  }

  // Start with default_member_permissions check
  let allowed = (permBits & defaultPermBit) === defaultPermBit;

  // Application-wide override entry (id == applicationId)
  const appEntry = commandPerms.find((p) => p.id === applicationId);
  if (appEntry) {
    const result = applyOverrides(
      appEntry.permissions,
      userId,
      memberRoles,
      guildId
    );
    if (result !== null) allowed = result;
  }

  // Per-command override entry (matched by name) — skipped when action has no command equivalent
  if (commandName) {
    const cmdEntry = commandPerms.find((p) => p.name === commandName);
    if (cmdEntry) {
      const result = applyOverrides(
        cmdEntry.permissions,
        userId,
        memberRoles,
        guildId
      );
      if (result !== null) allowed = result;
    }
  }

  return allowed;
}
