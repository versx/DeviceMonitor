import { Snowflake } from 'discord.js';

export type DeviceMonitorConfig = {
  clearMessagesOnStartup: boolean;
  ignoredDevices: string[];
  updateIntervalM: number;
  userAlerts: string[];
  bot: {
    prefix: string,
    clientId: Snowflake;
    token: string;
    status: string | null;
  };
  logs: {
    level: LogLevel;
    colors: LogColorsConfig;
  };
  scanner: {
    type: ScannerType;
    url: string;
    secret: string;
    username: string;
    password: string;
  };
  times: {
    offlineM: number;
    warningM: number;
  };
  servers: {
    [guildId: Snowflake]: DiscordGuildConfig;
  };
};

export type DiscordGuildConfig = {
  name?: string;
  summaryChannelId: Snowflake | null;
  ignoredDevices: string[];
  devices: string[];
  roleLogging: {
    enabled: boolean;
    channelId: Snowflake;
    roleIds: Snowflake[];
  };
};

export type ApiDevice = {
  uuid: string;
  last_seen: number;
}

export interface Command {
  name: string,
  execute: (message: Message, args: Array<string>) => void,
  permissions: Array<PermissionResolvable>,
  aliases: Array<string>,
  cooldown?: number,
};

export interface BotEvent {
  name: string,
  once?: boolean | false,
  execute: (...args?) => void,
};

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>,
    cooldowns: Collection<string, number>,
  };
};

export type ColorType = 'text' | 'variable' | 'warn' | 'error' | 'date';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'none';

export type DeviceState = 'online' | 'offline' | 'warn';

export type ScannerType = 'rdm' | 'golbat';

export type DeviceManifest = {
  [uuid: string]: {
    uuid: string;
    lastSeen: number;
    alerted: boolean;
    state?: DeviceState;
  };
};

export type DeviceGroupOptions = {
  guild: Guild;
  devices: string[];
  deviceState: DeviceState;
  messageId: Snowflake;
};

export type DeviceStates = {
  online: string[];
  warning: string[];
  offline: string[];
};

export type StatusMessageStates = {
  [guildId: Snowflake]: {
    //devices: DeviceManifest;
    onlineMessageId: Snowflake;
    warnMessageId: Snowflake;
    offlineMessageId: Snowflake;
    lastUpdateMessageId: Snowflake;
    isChannelCleared: boolean | false;
  };
};