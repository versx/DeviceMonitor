import {
  Colors,
  EmbedBuilder,
  GuildMember,
  TextChannel,
} from 'discord.js';

import {
  getDifference, hasRole, isPlural,
  log, logDebug, logError, logWarn,
} from '../services';
import { BotEvent, DeviceMonitorConfig } from '../types';
const config: DeviceMonitorConfig = require('../config.json');

const event: BotEvent = {
  name: 'guildMemberUpdate',
  once: false,
  execute: async (oldMember: GuildMember, newMember: GuildMember) => {
    const guildPrefix = `[${newMember.guild.name}]`;
    const userPrefix = `[${newMember.user.username}]`;
    if (!config.servers[newMember.guild.id]) {
      logWarn(`${guildPrefix} Guild not configured, skipping...`);
      return;
    }

    const { roleLogging: { enabled, channelId, roleIds } } = config.servers[newMember.guild.id];
    if (!enabled || !channelId || roleIds.length === 0) {
      return;
    }

    if (oldMember.roles.cache.size === newMember.roles.cache.size) {
      logWarn(`${guildPrefix} ${userPrefix} User roles have not changed, skipping...`);
      return;
    }

    const channel = newMember.client.channels.cache.get(channelId);
    if (!channel) {
      logError(`${guildPrefix} ${userPrefix} Failed to get log channel with id ${channelId}, skipping...`);
      return;
    }

    const { assigned, unassigned } = getDifference(oldMember.roles.cache, newMember.roles.cache);

    if (assigned.length > 0 && !hasRole(roleIds, assigned.map(role => role.id))) {
      logDebug(`${guildPrefix} ${userPrefix} Role ${assigned.map(role => role.name).join(', ')} was assigned but it is not in configured role list, skipping`);
      return;
    }

    if (unassigned.length > 0 && !hasRole(roleIds, unassigned.map(role => role.id))) {
      logDebug(`${guildPrefix} ${userPrefix} Role ${unassigned.map(role => role.name).join(', ')} was unassigned but it is not in configured role list, skipping`);
      return;
    }

    const assignedRoleNames = assigned.filter((role) => roleIds.includes(role.id)).map(role => role.name).join(', ');
    const unassignedRoleNames = unassigned.filter((role) => roleIds.includes(role.id)).map(role => role.name).join(', ');
    const embed = new EmbedBuilder()
      .setAuthor({
        name: newMember.user.username,
        iconURL: newMember.user.displayAvatarURL({ forceStatic: true }),
      })
      .setTitle(assigned.length > 0
        ? `Assigned Role${isPlural(assigned.length)}: ${assignedRoleNames}`
        : `Unassigned Role${isPlural(unassigned.length)}: ${unassignedRoleNames}`
      )
      .setColor(assigned.length > 0
        ? Colors.Green
        : unassigned.length > 0
          ? Colors.Red
          : Colors.Blurple
      )
      .setFooter({
        text: `${newMember.guild.name} | ${new Date().toLocaleString()}`,
        iconURL: newMember.guild.iconURL({ forceStatic: true }) ?? '',
      });

    if (assigned.length > 0) {
      log(`${guildPrefix} ${userPrefix} Assigned role${isPlural(assigned.length)}: ${assignedRoleNames}`);
    }

    if (unassigned.length > 0) {
      log(`${guildPrefix} ${userPrefix} Unassigned role${isPlural(unassigned.length)}: ${unassignedRoleNames}`);
    }

    await (channel as TextChannel).send({ embeds: [embed] });
  },
};

export default event;