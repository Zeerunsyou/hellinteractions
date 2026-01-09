import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

const PROFILE_COMMAND = {
  name: 'profile',
  type: 1,
  description: 'Lookup a Roblox Profile by Username',
  integration_types: [1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'username',
      description: 'The Roblox username to look up',
      type: 3, // STRING
      required: true,
    },
  ],
};

const VIEW_COMMAND = {
  name: 'view',
  type: 1,
  description: 'View Discord user info by ID',
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'userid',
      description: 'Discord User ID',
      type: 3,
      required: true,
    },
  ],
};

const PING_COMMAND = {
  name: 'ping',
  type: 1,
  description: 'Ping → Shows a modal and replies Pong',
  integration_types: [1], // works in DMs and servers
  contexts: [0, 1, 2],
};

const ALL_COMMANDS = [
  PROFILE_COMMAND,
  PING_COMMAND,
  VIEW_COMMAND,
];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
