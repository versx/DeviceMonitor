import config from '../config.json';
import { Command } from '../types';

const command: Command = {
  name: 'help',
  execute: async (message, args) => {
    const prefix = config.bot.prefix;
    let msg = '**Help**\n' +
      '-------------------------------------------\n' +
      '- **' + prefix + 'help**\n\t- Shows this page.\n'
    ;
    await message.channel.send(msg);
  },
  permissions: [],
  aliases: [],
};

export default command;