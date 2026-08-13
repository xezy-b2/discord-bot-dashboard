const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const GuildConfig = require('../database/models/GuildConfig');
const { generateCard, formatVariables } = require('../utils/generateCard');
const { sendLog, buildLogEmbed } = require('../utils/logger');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const config = await GuildConfig.findOne({ guildId: member.guild.id });

    sendLog(member.guild, 'memberLeave', buildLogEmbed({
      title: '📤 Membre parti',
      color: '#ED4245',
      fields: [
        { name: 'Membre', value: `${member.user.tag} (${member.id})`, inline: true }
      ]
    }));

    if (!config || !config.leave?.enabled) return;

    const cfg = config.leave;
    const channel = cfg.channelId ? member.guild.channels.cache.get(cfg.channelId) : null;
    if (!channel) return;

    const data = {
      userId: member.id,
      username: member.user.username,
      tag: member.user.tag,
      serverName: member.guild.name,
      memberCount: member.guild.memberCount,
      avatarUrl: member.user.displayAvatarURL({ extension: 'png', size: 256 })
    };

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
        .setColor(cfg.embedColor || '#ED4245')
        .setDescription(formatVariables(cfg.message, data));
      if (cfg.embedThumbnail) embed.setThumbnail(data.avatarUrl);

      if (cfg.embedImageEnabled) {
        if (cfg.embedImageSource === 'avatar') {
          embed.setImage(data.avatarUrl);
        } else if (cfg.embedImageSource === 'custom' && cfg.embedImageUrl) {
          embed.setImage(cfg.embedImageUrl);
        } else {
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
};
