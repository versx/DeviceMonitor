import { Client } from 'discord.js';

import { color, initialize, log } from '../services';
import { BotEvent, DeviceMonitorConfig } from '../types';

const config: DeviceMonitorConfig = require('../config.json');

const event: BotEvent = {
  name: 'ready',
  once: true,
  execute: async (client: Client) => {
    log(color('text', `💪 Logged in as ${color('variable', client.user?.tag)}`));

    if (config?.bot?.status) {
      client.user?.setActivity(config.bot.status);
    }

    await initialize(client);
  },
};

export default event;