const GuildConfig = require('../database/models/GuildConfig');
const Afk = require('../database/models/Afk');
const { addXp } = require('../utils/levelSystem');
const { analyzeMessage } = require('../utils/automod');
const { formatVariables } = require('../utils/generateCard');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // --- AFK : retour d'absence ---
    const ownAfk = await Afk.findOneAndDelete({ guildId: message.guild.id, userId: message.author.id });
    if (ownAfk) {
      const currentName = message.member?.nickname || '';
      if (currentName.startsWith('[AFK] ')) {
        message.member.setNickname(ownAfk.originalNickname).catch(() => {});
      }
      message.reply(`👋 Bon retour ${message.author}, ton statut AFK a été retiré.`).catch(() => {});
    }

    // --- AFK : notifier si un membre mentionne quelqu'un d'absent ---
    if (message.mentions.users.size > 0) {
      const mentionedIds = [...message.mentions.users.keys()].filter(id => id !== message.author.id);
      if (mentionedIds.length) {
        const afkMentioned = await Afk.find({ guildId: message.guild.id, userId: { $in: mentionedIds } });
        for (const afk of afkMentioned) {
          const sinceTs = Math.floor(afk.since.getTime() / 1000);
          message.reply(`💤 <@${afk.userId}> est AFK depuis <t:${sinceTs}:R> : *${afk.reason}*`).catch(() => {});
        }
      }
    }

    const config = await GuildConfig.findOne({ guildId: message.guild.id });
    if (!config) return;

    // --- AUTOMOD ---
    if (config.automod?.enabled) {
      const isIgnoredChannel = config.automod.ignoredChannels.includes(message.channel.id);
      const isIgnoredRole = message.member?.roles.cache.some(r => config.automod.ignoredRoles.includes(r.id));

      if (!isIgnoredChannel && !isIgnoredRole) {
        const violation = analyzeMessage(message, config.automod);
        if (violation) {
          await message.delete().catch(() => {});
          const warnMsg = await message.channel.send(
            `⚠️ ${message.author}, ton message a été supprimé (raison : \`${violation}\`).`
          ).catch(() => {});
          if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
          return; // on ne compte pas l'XP sur un message supprimé
        }
      }
    }

    // --- COMMANDES CUSTOM (prefix) ---
    if (config.prefix && message.content.startsWith(config.prefix)) {
      const cmdName = message.content.slice(config.prefix.length).trim().split(/\s+/)[0]?.toLowerCase();
      const custom = config.customCommands.find(c => c.enabled && c.name.toLowerCase() === cmdName);
      if (custom) {
        const formatted = formatVariables(custom.response, {
          userId: message.author.id,
          username: message.author.username,
          tag: message.author.tag,
          serverName: message.guild.name,
          memberCount: message.guild.memberCount
        });
        return message.channel.send(formatted).catch(() => {});
      }
    }

    // --- LEVELING ---
    if (config.leveling?.enabled) {
      const ignored = config.leveling.ignoredChannels.includes(message.channel.id);
      const noXpRole = message.member?.roles.cache.some(r => config.leveling.noXpRoles.includes(r.id));
      if (!ignored && !noXpRole) {
        const result = await addXp(message.guild.id, message.author.id, config.leveling);
        if (result?.leveledUp) {
          const targetChannel = config.leveling.levelUpChannelId
            ? message.guild.channels.cache.get(config.leveling.levelUpChannelId)
            : message.channel;

          const text = formatVariables(config.leveling.levelUpMessage, {
            userId: message.author.id,
            username: message.author.username,
            tag: message.author.tag,
            serverName: message.guild.name,
            memberCount: message.guild.memberCount
          }).replace('{level}', result.newLevel);

          targetChannel?.send(text).catch(() => {});

          // Attribution de role recompense si configure pour ce niveau
          const reward = config.leveling.roleRewards.find(r => r.level === result.newLevel);
          if (reward) {
            message.member.roles.add(reward.roleId).catch(() => {});
          }
        }
      }
    }
  }
};
