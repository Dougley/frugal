import type {
  ComponentContext,
  ModalInteractionContext,
} from "slash-create/web";
import * as EditButton from "./components/edit-modal";
import * as JoinButton from "./components/join-button";
import CheckEntriesCommand from "./message/check-entries";
import CopyGiveawayIdCommand from "./message/copy-giveaway-id";
import EditGiveawayCommand from "./message/edit-giveaway";
import EndGiveawayCommand from "./message/end-giveaway";
import GiveawayStatusCommand from "./message/giveaway-status";
import RerollGiveawayCommand from "./message/reroll-giveaway";
import DebugCommand from "./slash/debug";
import EditCommand from "./slash/edit";
import GiveawayCommand from "./slash/giveaway";
import ListCommand from "./slash/list";
import PingCommand from "./slash/ping";
import RerollCommand from "./slash/reroll";
import StartCommand from "./slash/start";
import StopCommand from "./slash/stop";

// Export an array of command classes for slash-create
export const commands = [
  EditCommand,
  EditGiveawayCommand,
  EndGiveawayCommand,
  GiveawayCommand,
  ListCommand,
  CheckEntriesCommand,
  CopyGiveawayIdCommand,
  GiveawayStatusCommand,
  PingCommand,
  RerollCommand,
  RerollGiveawayCommand,
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
  CheckEntriesCommand,
  CopyGiveawayIdCommand,
  DebugCommand,
  EditCommand,
  EditGiveawayCommand,
  EndGiveawayCommand,
  GiveawayCommand,
  GiveawayStatusCommand,
  ListCommand,
  PingCommand,
  RerollCommand,
  RerollGiveawayCommand,
  StartCommand,
  StopCommand,
};
