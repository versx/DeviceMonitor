import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { logError } from './services';
import { Command, DeviceMonitorConfig } from './types';
const config: DeviceMonitorConfig = require('./config.json');

const client = new Client({intents:[
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.MessageContent,
]});
client.commands = new Collection<string, Command>();
client.cooldowns = new Collection<string, number>();

const handlersDir = join(__dirname, './handlers');
readdirSync(handlersDir).forEach((handler: string) => {
  if (!handler.endsWith('.js')) {
    return;
  }
  require(`${handlersDir}/${handler}`)(client);
});

client.login(config.bot.token);

process.on('exit', (code: number) => logError(`Process exiting with exit code: ${code}`));