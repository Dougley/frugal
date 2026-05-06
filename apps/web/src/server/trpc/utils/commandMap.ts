import { PermissionFlagsBits } from "discord-api-types/v10";

export type ActionKey =
  | "giveaways.create"
  | "giveaways.view"
  | "giveaways.list"
  | "giveaways.edit"
  | "giveaways.stop"
  | "giveaways.reroll"
  | "giveaways.analytics"
  | "settings.view"
  | "settings.update"
  | "templates.view"
  | "templates.manage";

type CommandEntry = {
  command?: string;
  defaultPerms: bigint;
};

export const ACTION_MAP: Record<ActionKey, CommandEntry> = {
  "giveaways.create": {
    command: "start",
    defaultPerms: PermissionFlagsBits.ManageEvents,
  },
  "giveaways.view": {
    defaultPerms: PermissionFlagsBits.ManageEvents,
  },
  "giveaways.list": {
    defaultPerms: PermissionFlagsBits.ManageEvents,
  },
  "giveaways.edit": {
    command: "edit",
    defaultPerms: PermissionFlagsBits.ManageEvents,
  },
  "giveaways.stop": {
    command: "stop",
    defaultPerms: PermissionFlagsBits.ManageEvents,
  },
  "giveaways.reroll": {
    command: "reroll",
    defaultPerms: PermissionFlagsBits.ManageEvents,
  },
  "giveaways.analytics": {
    command: "analytics",
    defaultPerms: PermissionFlagsBits.ManageEvents,
  },
  "settings.view": {
    command: "settings",
    defaultPerms: PermissionFlagsBits.ManageEvents,
  },
  "settings.update": {
    command: "settings",
    defaultPerms: PermissionFlagsBits.ManageEvents,
  },
  "templates.view": {
    command: "template",
    defaultPerms: PermissionFlagsBits.ManageEvents,
  },
  "templates.manage": {
    command: "template",
    defaultPerms: PermissionFlagsBits.ManageEvents,
  },
};
