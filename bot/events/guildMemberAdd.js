const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const GuildConfig = require('../database/models/GuildConfig');
const { generateCard, formatVariables } = require('../utils/generateCard');
const { sendLog, buildLogEmbed } = require('../utils/logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const config = await GuildConfig.findOne({ guildId: member.guild.id });

    // Log independant du message de bienvenue (peut etre active meme si la bienvenue est desactivee)
    sendLog(member.guild, 'memberJoin', buildLogEmbed({
      title: '📥 Nouveau membre',
      color: '#57F287',
      fields: [
        { name: 'Membre', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: 'Compte créé le', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`, inline: true }
      ]
    }));

    // Roles automatiques : independants du message de bienvenue, s'appliquent toujours si actives
    if (config?.autoRoles?.enabled && config.autoRoles.roleIds?.length) {
      for (const roleId of config.autoRoles.roleIds) {
        await member.roles.add(roleId).catch(err => {
          console.error(`[AUTO-ROLES] Impossible d'attribuer le rôle ${roleId} à ${member.user.tag} :`, err.message);
        });
      }
    }

    if (!config || !config.welcome?.enabled) return;

    const cfg = config.welcome;
    const channel = cfg.channelId ? member.guild.channels.cache.get(cfg.channelId) : null;

    const data = {
      userId: member.id,
      username: member.user.username,
      tag: member.user.tag,
      serverName: member.guild.name,
      memberCount: member.guild.memberCount,
      avatarUrl: member.user.displayAvatarURL({ extension: 'png', size: 256 })
    };

    if (channel) {
      const payload = {};
      let cardBuffer = null;
      let cardAttached = false;

      if (cfg.mode === 'image' || cfg.mode === 'both') {
        cardBuffer = await generateCard(cfg, data);
        payload.files = [new AttachmentBuilder(cardBuffer, { name: 'card.png' })];
        cardAttached = true;
      }

      if (cfg.mode === 'embed' || cfg.mode === 'both') {
        const embed = new EmbedBuilder()
          .setColor(cfg.embedColor || '#5865F2')
          .setDescription(formatVariables(cfg.message, data));
        if (cfg.embedThumbnail) embed.setThumbnail(data.avatarUrl);

        if (cfg.embedImageEnabled) {
          if (cfg.embedImageSource === 'avatar') {
            embed.setImage(data.avatarUrl);
          } else if (cfg.embedImageSource === 'custom' && cfg.embedImageUrl) {
            embed.setImage(cfg.embedImageUrl);
          } else {
            // Reutilise la carte deja generee/attachee (mode "both") plutot que d'en creer une seconde
            if (!cardAttached) {
              if (!cardBuffer) cardBuffer = await generateCard(cfg, data);
              payload.files = [...(payload.files || []), new AttachmentBuilder(cardBuffer, { name: 'card.png' })];
              cardAttached = true;
            }
            embed.setImage('attachment://card.png');
          }
        }

        payload.embeds = [embed];
      }

      if (cfg.mode === 'image') {
        payload.content = formatVariables(cfg.message, data);
      }

      await channel.send(payload).catch(console.error);
    }

    if (cfg.dmEnabled) {
      member.send(formatVariables(cfg.dmMessage, data)).catch(() => {});
    }

    // Attribution auto de role si configure au niveau leveling (level 0 reward) - optionnel, extensible
  }
};