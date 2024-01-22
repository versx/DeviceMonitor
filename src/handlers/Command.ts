import { Client } from 'discord.js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { color, log } from '../services';
import { Command } from '../types';

module.exports = (client: Client) => {
  const commands: Command[] = [];
  const commandsDir = join(__dirname, '../commands');

  readdirSync(commandsDir).forEach(file => {
    if (!file.endsWith('.js')) {
      return;
    }
    const command: Command = require(`${commandsDir}/${file}`).default;
    commands.push(command);
    client.commands.set(command.name, command);
  });

  log(color('text', `🔥 Successfully loaded ${color('variable', commands.length)} command(s)`));
};