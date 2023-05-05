import editMsgContextCommand from './message/edit';
import rerollMsgContextCommand from './message/reroll';
import stopMsgContextCommand from './message/stop';
import editSlashCommand from './slash/edit';
import inviteSlashCommand from './slash/invite';
import listSlashCommand from './slash/list';
import pingSlashCommand from './slash/ping';
import startSlashCommand from './slash/start';

export const commands = [
  // Slash commands
  pingSlashCommand,
  startSlashCommand,
  editSlashCommand,
  listSlashCommand,
  inviteSlashCommand,

  // Message commands
  editMsgContextCommand,
  rerollMsgContextCommand,
  stopMsgContextCommand
];
