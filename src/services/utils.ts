import chalk from 'chalk';
import {
  Collection,
  GuildMember,
  PermissionFlagsBits,
  PermissionResolvable,
  Role,
  Snowflake,
  TextChannel,
} from 'discord.js';

import { ColorType, DeviceMonitorConfig } from '../types';
const config: DeviceMonitorConfig = require('../config.json');

export const color = (color: ColorType, message: any) => chalk.hex(config.logs.colors[color])(message);

export const getThemeColor = (color: ColorType) => Number(`0x${config.logs.colors[color].substring(1)}`);

export const getTime = () => Math.floor(new Date().getTime() / 1000);

export const checkPermissions = (member: GuildMember, permissions: Array<PermissionResolvable>) => {
  const neededPermissions: PermissionResolvable[] = [];
  permissions.forEach(permission => {
    if (!member.permissions.has(permission)) {
      neededPermissions.push(permission);
    }
  });

  if (neededPermissions.length === 0) return null;
  return neededPermissions.map((perm: PermissionResolvable) => {
    if (typeof perm === 'string') {
      return perm.split(/(?=[A-Z])/).join(' ');
    } else {
      return Object.keys(PermissionFlagsBits)
        .find((key: string) => Object(PermissionFlagsBits)[key] === perm)
        ?.split(/(?=[A-Z])/)
        .join(' ');
    }
  });
};

export const sendTimedMessage = (message: string, channel: TextChannel, duration: number) => {
  channel.send(message)
    .then(m => setTimeout(async () => (await channel.messages.fetch(m)).delete(), duration));
  return;
};

export const createBearerToken = (username: string, password: string) => {
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  return token;
};

export const stringSorter = (a: string, b: string) => {
  const nameA = a.toUpperCase();
  const nameB = b.toUpperCase();
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
};

export const isPlural = (value: number) => value > 1 ? 's' : '';

export const getDifference = (oldRoles: Collection<string, Role>, newRoles: Collection<string, Role>) => ({
  assigned: newRoles.filter(role => !oldRoles.get(role.id)).map(role => role),
  unassigned: oldRoles.filter(role => !newRoles.get(role.id)).map(role => role),
});
  
export const hasRole = (configRoleIds: Snowflake[], newRoleIds: Snowflake[]) => {
  return newRoleIds.filter(roleId => configRoleIds.includes(roleId)).length > 0;
};