import type {
  ComponentContext,
  ModalInteractionContext,
} from "slash-create/web";
import * as EditButton from "./components/edit-modal";
import * as JoinButton from "./components/join-button";
import CheckEntriesCommand from "./message/check-entries";
import CopyGiveawayIdCommand from "./message/copy-giveaway-id";
import GiveawayStatusCommand from "./message/giveaway-status";
import DebugCommand from "./slash/debug";
import EditCommand from "./slash/edit";
import ListCommand from "./slash/list";
import PingCommand from "./slash/ping";
import RerollCommand from "./slash/reroll";
import StartCommand from "./slash/start";
import StopCommand from "./slash/stop";

// Export an array of command classes for slash-create
export const commands = [
  EditCommand,
  ListCommand,
  CheckEntriesCommand,
  CopyGiveawayIdCommand,
  GiveawayStatusCommand,
  PingCommand,
  RerollCommand,
  DebugCommand,
  StartCommand,
  StopCommand,
];

// Component handlers to register, now using regex patterns
export const componentHandlers: {
  pattern?: RegExp;
  custom_id?: string;
  handler: (ctx: ComponentContext) => Promise<unknown>;
}[] = [
  {
    pattern: JoinButton.custom_id_regex,
    handler: JoinButton.handleInteraction,
  },
  {
    pattern: EditButton.button_id_regex,
    handler: EditButton.handleButtonInteraction,
  },
];

// Modal handlers to register, now using regex patterns
export const modalHandlers: {
  pattern?: RegExp;
  custom_id?: string;
  handler: (ctx: ModalInteractionContext) => Promise<unknown>;
}[] = [
  {
    pattern: EditButton.modal_id_regex,
    handler: EditButton.handleModalSubmit,
  },
];

// Also export individual commands for reference if needed
export {
  EditCommand,
  CheckEntriesCommand,
  CopyGiveawayIdCommand,
  GiveawayStatusCommand,
  ListCommand,
  PingCommand,
  RerollCommand,
  DebugCommand,
  StartCommand,
  StopCommand,
};
