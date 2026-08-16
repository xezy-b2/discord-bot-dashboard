const { AttachmentBuilder } = require('discord.js');
const GuildConfig = require('../database/models/GuildConfig');
const Afk = require('../database/models/Afk');
const MemberLevel = require('../database/models/MemberLevel');
const { addXp, xpForLevel } = require('../utils/levelSystem');
const { analyzeMessage } = require('../utils/automod');
const { formatVariables } = require('../utils/generateCard');
const { generateRankCard } = require('../utils/generateRankCard');

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

          const varData = {
            userId: message.author.id,
            username: message.author.username,
            tag: message.author.tag,
            serverName: message.guild.name,
            memberCount: message.guild.memberCount,
            level: result.newLevel,
            avatarUrl: message.author.displayAvatarURL({ extension: 'png', size: 256 })
          };

          const mode = config.leveling.levelUpMode || 'text';
          const payload = {};

          // Le texte accompagne toujours l'annonce (meme en mode "Carte generee" seule) :
          // il sert de legende au-dessus de l'image.
          payload.content = formatVariables(config.leveling.levelUpMessage, varData).replace('{level}', result.newLevel);
          if (mode === 'card' || mode === 'both') {
            const rank = await MemberLevel.countDocuments({
              guildId: message.guild.id,
              totalXp: { $gt: result.member.totalXp }
            }) + 1;

            const buffer = await generateRankCard(config.leveling.levelUpCard, {
              username: message.author.username,
              avatarUrl: varData.avatarUrl,
              rank,
              level: result.newLevel,
              xp: result.member.xp,
              requiredXp: xpForLevel(result.newLevel)
            });
            payload.files = [new AttachmentBuilder(buffer, { name: 'levelup.png' })];
          }

          targetChannel?.send(payload).catch(() => {});

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
