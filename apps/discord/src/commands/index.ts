import type {
  ComponentContext,
  ModalInteractionContext,
} from "slash-create/web";
import EditButton from "./components/edit-modal";
import JoinButton from "./components/join-button";
import EditCommand from "./slash/edit";
import ListCommand from "./slash/list";
import PingCommand from "./slash/ping";
import RerollCommand from "./slash/reroll";
import SaveTestCommand from "./slash/savetest";
import StartCommand from "./slash/start";
import StopCommand from "./slash/stop";

// Export an array of command classes for slash-create
export const commands = [
  EditCommand,
  ListCommand,
  PingCommand,
  RerollCommand,
  SaveTestCommand,
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
  ListCommand,
  PingCommand,
  RerollCommand,
  SaveTestCommand,
  StartCommand,
  StopCommand,
};
