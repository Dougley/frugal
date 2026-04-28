import { PermissionFlagsBits } from "discord-api-types/v10";
import type {
  CommandContext,
  ComponentContext,
  ModalInteractionContext,
} from "slash-create/web";

type DiscordInteraction =
  | CommandContext
  | ComponentContext
  | ModalInteractionContext;

type GiveawayOwner = {
  hostId?: string | null;
};

const GIVEAWAY_MANAGER_PERMISSIONS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageMessages,
];

export function hasGiveawayManagerPermission(ctx: DiscordInteraction) {
  return ctx.member?.permissions.any(GIVEAWAY_MANAGER_PERMISSIONS) ?? false;
}

export function canManageGiveaway(
  ctx: DiscordInteraction,
  giveaway: GiveawayOwner
) {
  return giveaway.hostId === ctx.user.id || hasGiveawayManagerPermission(ctx);
}
