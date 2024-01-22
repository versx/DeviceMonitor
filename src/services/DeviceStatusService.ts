import {
  Client,
  EmbedBuilder,
  Guild,
  Snowflake,
  TextChannel,
} from 'discord.js';

import {
  color, createBearerToken, getTime,
  log, logDebug, logError, logWarn,
} from '.';
import {
  ApiDevice,
  DeviceManifest,
  DeviceMonitorConfig,
  DeviceState,
  DeviceStates,
  StatusMessageStates,
} from '../types';

const config: DeviceMonitorConfig = require('../config.json');
const messageStates: StatusMessageStates = {};
const devices: DeviceManifest = {};
const DefaultOptions = {
  titles: {
    online: 'Working Devices:',
    warning: 'Warned Devices:',
    offline: 'Offline Devices:',
  },
  images: {
    online: 'https://raw.githubusercontent.com/Kneckter/RDMMonitor/master/static/ok.png',
    warning: 'https://raw.githubusercontent.com/Kneckter/RDMMonitor/master/static/warned.png',
    offline: 'https://raw.githubusercontent.com/Kneckter/RDMMonitor/master/static/offline.png',
  },
  colors: {
    online: 0x008000,
    warning: 0xFFFF00,
    offline: 0xFF0000,
  },
  times: {
    offlineM: config.times.offlineM * 60 * 1000,
    warningM: config.times.warningM * 60 * 1000,
    rebuildM: 0.25 * 60 * 1000,
    updateM: config.updateIntervalM * 60 * 1000,
    alertsM: 1 * 60 * 1000,
  },
  endpoints: {
    rdmDevices: 'api/get_data?show_devices=true',
    golbatDevices: 'api/devices/all',
  },
};

export const initialize = async (client: Client) => {
  const guilds = client.guilds.cache.filter((guild) => !!config.servers[guild.id]);
  if (guilds.size === 0) {
    logError(`[${color('variable', client.user?.id!)}] Bot is not in any configured guilds, exiting...`);
    process.exit(-1);
  }

  // Start posting device states
  await postDeviceGroupStates(client);

  // Send direct message of offline devices to users
  await sendOfflineDeviceAlerts(client);
};

export const postLastUpdated = async (client: Client, channelId: Snowflake) => {
  let channel = client.channels.cache.get(channelId);
  if (!channel) {
    logWarn(`Failed to get channel with id: ${channelId}`);
    return;
  }

  // Ignore channels that are not text based
  if (!channel.isTextBased()) {
    logWarn(`Failed to post last updated status, channel is not text based.`);
    return;
  }

  let messageId: Snowflake | undefined;
  const lastUpdated = `Last updated at: **${new Date().toLocaleString()}**`;

  channel = channel as TextChannel;

  const lastUpdateMessageId = messageStates[channel.guildId].lastUpdateMessageId;
  if (lastUpdateMessageId) {
    const message = channel.messages.cache.get(lastUpdateMessageId);
    const edited = await message?.edit(lastUpdated);
    messageId = edited?.id;
  } else {
    const message = await channel.send(lastUpdated);
    messageId = message.id;
  }

  if (messageId) {
    messageStates[channel.guildId].lastUpdateMessageId = messageId;
  }
};

export const postDeviceGroupState = async (guild: Guild, devices: string[], state: DeviceState, messageId: Snowflake) => {
  const guildConfig = config.servers[guild.id];
  if (!guildConfig?.summaryChannelId) {
    return;
  }

  const channelId = guildConfig.summaryChannelId;
  let channel = guild.channels.cache.get(channelId);
  if (!channel) {
    logWarn(`Failed to get channel with id: ${channelId}`);
    return;
  }

  // Ignore channels that are not text based
  if (!channel.isTextBased()) {
    logWarn(`Failed to post last updated status, channel is not text based.`);
    return;
  }

  channel = channel as TextChannel;

  const titleText = state === 'offline'
    ? DefaultOptions.titles.offline
    : state === 'warn'
      ? DefaultOptions.titles.warning
      : DefaultOptions.titles.online;
  const title = `${titleText} ${devices.length === 1 ? devices[0] === 'None' ? 0 : devices.length.toLocaleString() : devices.length.toLocaleString()}`;
  const color = state === 'offline'
    ? DefaultOptions.colors.offline
    : state === 'warn'
      ? DefaultOptions.colors.warning
      : DefaultOptions.colors.online;
  const image = state === 'offline'
    ? DefaultOptions.images.offline
    : state === 'warn'
      ? DefaultOptions.images.warning
      : DefaultOptions.images.online;
  const status = getDeviceString(devices);
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setThumbnail(image)
    .setDescription(status);

  if (!messageId) {
    return await channel.send({ embeds: [embed] });
  }

  const message = channel.messages.cache.get(messageId);
  if (!message) {
    logError(`[${guild.name}] Missing device summary message: ${messageId}`);
    return;
  }
  
  return await message.edit({ embeds: [embed] });
};

export const postDeviceGroupStates = async (client: Client) => {
  // Initialize status message states dictionary
  initStatusMessageStates();

  // Retrieve list of devices
  await updateDevices();

  //const states = getDeviceStates();
  for (const guildId in config.servers) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logWarn(`Failed to get guild with id: ${guildId}`);
      continue;
    }

    const guildConfig = config.servers[guildId];
    if (!guildConfig?.summaryChannelId) {
      logWarn(`Failed to get guild config with id: ${guildId}`);
      continue;
    }

    log(`[${guild.name}] Posting device summary`);
    
    if (config.clearMessagesOnStartup) {
      log(`[${guild.name}] Clearing channel messages...`);
      messageStates[guildId].isChannelCleared = await clearMessages(client, guildId, guildConfig.summaryChannelId);
    }

    const states = getDeviceStates(guild.id);
    log(`[${guild.name}] Starting Discord status message postings...`);
    const onlineDeviceMessage = await postDeviceGroupState(guild, states.online, 'online', messageStates[guildId].onlineMessageId);
    if (onlineDeviceMessage?.id) {
      messageStates[guildId].onlineMessageId = onlineDeviceMessage.id;
    }

    const warnDeviceMessage = await postDeviceGroupState(guild, states.warning, 'warn', messageStates[guildId].warnMessageId);
    if (warnDeviceMessage?.id) {
      messageStates[guildId].warnMessageId = warnDeviceMessage.id;
    }

    const offlineDeviceMessage = await postDeviceGroupState(guild, states.offline, 'offline', messageStates[guildId].offlineMessageId);
    if (offlineDeviceMessage?.id) {
      messageStates[guildId].offlineMessageId = offlineDeviceMessage.id;
    }

    await postLastUpdated(client, guildConfig.summaryChannelId!);
    log(`[${guild.name}] Finished posting device summary.`);
  }

  log(`Finished posting device summary to ${Object.keys(config.servers).length} servers.`);
  setTimeout(async () => await postDeviceGroupStates(client), DefaultOptions.times.updateM);
};

export const updateDevices = async () => {
  logDebug(`Fetching devices from API...`);

  const endpoint = config.scanner.type === 'rdm'
    ? DefaultOptions.endpoints.rdmDevices
    : DefaultOptions.endpoints.golbatDevices;
  const response = await sendApiRequest(endpoint);
  if (!response?.devices) {
    logError(`Failed to retrieve devices from API.`);
    return;
  }

  let index = 1;
  const devices = response.devices;
  for (const deviceUuid of Object.keys(devices)) {
    const device = {
      uuid: `#${index}`, //deviceUuid,
      last_seen: devices[deviceUuid].last_update,
    };
    if (!devices[deviceUuid]) {
      addDevice(device);
    } else {
      updateDevice(device);
    }
    index++;
  }
};

export const addDevice = (device: ApiDevice) => {
  if (config.ignoredDevices.length > 0 && config.ignoredDevices.indexOf(device.uuid) !== -1) {
    return;
  }

  const lastSeen = !!device.last_seen ? device.last_seen : 0;
  devices[device.uuid] = {
    uuid: device.uuid,
    lastSeen,
    alerted: false,
    state: getDeviceState(lastSeen),
  };
};

export const updateDevice = (device: ApiDevice) => {
  if (!devices[device.uuid]) {
    addDevice(device);
    return;
  }

  const lastSeen = !!device.last_seen ? device.last_seen : 0;
  devices[device.uuid].lastSeen = lastSeen;
  devices[device.uuid].state = getDeviceState(lastSeen);
};

export const clearMessages = async (client: Client, guildId: Snowflake, channelId: Snowflake) => {
  if (messageStates[guildId]?.isChannelCleared) {
    return true;
  }

  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    logError(`Failed to find channel with id: ${channel}`);
    return false;
  }

  // Ignore channels that are not text based
  if (!channel.isTextBased()) {
    logWarn(`Failed to delete messages in channel ${channel.name} (${channelId}), channel is not text based.`);
    return false;
  }
  
  try {
    // Loop all messages in channel and delete in bulk of 100 at a time
    const messages = await (<TextChannel> channel).bulkDelete(100, true);
    // Check if any messages are remaining
    if (messages.size > 0) {
      await clearMessages(client, guildId, channelId);
      return true;
    }
  } catch (err) {
    logError(err.message);
    return false;
  }

  log(`Finished clearing messages for channel: ${channelId}`);
  return true;
};

export const getDeviceString = (devices: string[]) => {
  //const guildConfig = config.servers[guildId];
  //const filteredDevices = devices.filter(device => {
  //  const isIgnored = guildConfig.ignoredDevices.length > 0 && guildConfig.ignoredDevices.includes(device);
  //  const isValid =  guildConfig.devices.length === 0 || guildConfig.devices.includes(device);
  //  return isIgnored || isValid;
  //});
  //let status = '';
  //for (let i = 0; i < filteredDevices.length; i++) {
  //  const device = filteredDevices[i];
  //  if (status.length + device.length + 2 > 2000) {
  //    return status + 'and more...';
  //  }

  //  if (guildConfig.ignoredDevices.length > 0 && guildConfig.ignoredDevices.includes(device)) {
  //    continue;
  //  }
  //  if (guildConfig.devices.length > 0 && !guildConfig.devices.includes(device)) {
  //    continue;
  //  }

  //  status += device;
  //  if (i !== filteredDevices.length - 1) {
  //    status += ', ';
  //  }
  //}
  //return !status || status === ''
  //  ? 'None'
  //  : status;
  let status = '';
  for (let i = 0; i < devices.length; i++) {
    const device = devices[i];
    if (status.length + device.length + 2 > 2000) {
      return status + 'and more...';
    }

    status += device;
    if (i !== devices.length - 1) {
      status += ', ';
    }
  }
  return status;
};

export const getDeviceStates = (guildId: Snowflake): DeviceStates => {
  const now = getTime();
  const states: DeviceStates = { online: [], warning: [], offline: [] };
  for (const uuid in devices) {
    const device = devices[uuid];
    if (!isValidDevice(guildId, device.uuid)) {
      continue;
    }

    const lastSeen = now - devices[uuid].lastSeen;
    if (lastSeen > DefaultOptions.times.offlineM / 1000) {
      states.offline.push(uuid);
    } else if (lastSeen > DefaultOptions.times.warningM / 1000) {
      states.warning.push(uuid);
    } else {
      states.online.push(uuid);
    }
  }

  if (states.online.length === 0) states.online.push('None');
  if (states.warning.length === 0) states.warning.push('None');
  if (states.offline.length === 0) states.offline.push('None');
  return states;
};

export const isValidDevice = (guildId: Snowflake, deviceName: string) => {
  const guildConfig = config.servers[guildId];
  const isIgnored = guildConfig.ignoredDevices.length === 0 || !guildConfig.ignoredDevices.includes(deviceName);
  const isValid =  guildConfig.devices.length === 0 || guildConfig.devices.includes(deviceName);
  return isIgnored && isValid;

  //if (guildConfig.ignoredDevices.length > 0 && guildConfig.ignoredDevices.includes(deviceName)) {
  //  return false;
  //}
  //if (guildConfig.devices.length > 0 && !guildConfig.devices.includes(deviceName)) {
  //  return false;
  //}
  //return true;
}

export const sendApiRequest = async (endpoint: string) => {
  const url = `${config.scanner.url}/${endpoint}`;
  const token = config.scanner.type === 'rdm'
    ? createBearerToken(config.scanner.username, config.scanner.password)
    : config.scanner.secret;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': config.scanner.type === 'rdm' ? `Bearer ${token}` : '',
      'X-Golbat-Secret': config.scanner.type === 'golbat' ? token : '',
      'Content-Type': 'application/json',
      //'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    logError(`Error while querying API: ${response.status} (${response.statusText})`);
    return;
  }

  let body;
  try {
    body = await response.json();
  } catch (err) {
    //if (body.includes('RealDeviceMap is starting')) {
    //  logError(`Failed to retrieve data from website while it was restarting...`);
    //} else {
      logError(`Failed to retrieve data from website: ${body}\nError: ${err}`);
    //}
    return body;
  }

  console.log('body response:', body.devices.length);

  if (body.status === 'error' || !body.data) {
    logError(`Failed to retrieve data from website: ${body.error}`);
    return body;
  }

  return body;
};

export const getDeviceState = (ts: number): DeviceState => {
  if (ts === 0) return 'offline';
  const lastSeen = getTime() - ts;
  if (lastSeen > DefaultOptions.times.offlineM / 1000) return 'offline';
  if (lastSeen > DefaultOptions.times.warningM / 1000) return 'warn';
  return 'online';
};

export const sendOfflineDeviceAlerts = async (client: Client) => {
  const now = getTime();
  const offlineDevices: string[] = [];

  // Build list of offline devices
  for (const uuid in devices) {
    const lastSeen = now - devices[uuid].lastSeen;
    if (lastSeen > DefaultOptions.times.offlineM / 60) {
      offlineDevices.push(uuid);
    }
  }

  // Check if any devices have gone offline
  for (const uuid of offlineDevices) {
    if (!devices[uuid].alerted) {
      await sendUserAlert(client, uuid, true);
      devices[uuid].alerted = true;
    }
  }

  // Check if any devices have come back online
  for (const uuid in devices) {
    if (devices[uuid].alerted && offlineDevices.indexOf(uuid) === -1) {
      devices[uuid].alerted = false;
      await sendUserAlert(client, uuid, false);
    }
  }

  setTimeout(() => sendOfflineDeviceAlerts(client), DefaultOptions.times.alertsM);
};

export const sendUserAlert = async (client: Client, deviceUuid: string, isDeviceOffline: boolean) => {
  const date = new Date().toLocaleString();
  const message = isDeviceOffline
    ? `[${date}] Device: ${deviceUuid} is offline!`
    : `[${date}] Device: ${deviceUuid} has come back online`;
  for (const userId of config.userAlerts) {
    const user = await client.users.fetch(userId);
    if (!user) {
      logError(`Cannot find a user to DM with id: ${userId}`);
      continue;
    }
    try {
      await user.send(message);
    } catch (err) {
      logError(`Failed to send a DM to user: ${user.id}`);
    }
  }
};

export const initStatusMessageStates = () => {
  for (const guildId in config.servers) {
    if (!messageStates[guildId]) {
      messageStates[guildId] = {
        onlineMessageId: '',
        warnMessageId: '',
        offlineMessageId: '',
        lastUpdateMessageId: '',
        isChannelCleared: false,
      };
    }
  }
};