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

// Discord enforces command-level permissions (default_member_permissions) before
// delivering interactions. Runtime checks here are only needed for the host
// carve-out — letting a giveaway's creator manage it regardless of their roles.
export function canManageGiveaway(
  ctx: DiscordInteraction,
  giveaway: GiveawayOwner
) {
  return giveaway.hostId === ctx.user.id;
}
