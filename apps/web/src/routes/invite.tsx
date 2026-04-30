import { createFileRoute, redirect } from "@tanstack/react-router";
import { BitField, PermissionFlags } from "discord-bitflag";

export const Route = createFileRoute("/invite")({
  beforeLoad: () => {
    const discordAppId = import.meta.env.VITE_DISCORD_APP_ID;

    if (!discordAppId) {
      throw redirect({ to: "/" });
    }

    // Build Discord OAuth2 authorization URL for bot
    const inviteUrl = new URL("https://discord.com/oauth2/authorize");
    inviteUrl.searchParams.set("client_id", discordAppId);
    inviteUrl.searchParams.set("scope", "bot applications.commands");
    inviteUrl.searchParams.set(
      "redirect_uri",
      `${import.meta.env.VITE_SITE_URL}/added`
    );
    inviteUrl.searchParams.set("response_type", "code");
    inviteUrl.searchParams.set(
      "permissions",
      new BitField([
        PermissionFlags.ViewChannel,
        PermissionFlags.SendMessages,
        PermissionFlags.EmbedLinks,
        PermissionFlags.AttachFiles,
        PermissionFlags.ReadMessageHistory,
        PermissionFlags.AddReactions,
        PermissionFlags.UseExternalEmojis,
      ]).value.toString()
    );

    throw redirect({ href: inviteUrl.toString() });
  },
});
