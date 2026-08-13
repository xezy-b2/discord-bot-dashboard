const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Affiche les informations du serveur'),

  async execute(interaction) {
    const guild = interaction.guild;
    await guild.fetch();

    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    const roles = guild.roles.cache.size - 1; // -1 pour @everyone

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`📊 ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }) || null)
      .addFields(
        { name: '👑 Propriétaire', value: `<@${guild.ownerId}>`, inline: true },
        { name: '👥 Membres', value: `${guild.memberCount}`, inline: true },
        { name: '📅 Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '💬 Salons texte', value: `${textChannels}`, inline: true },
        { name: '🔊 Salons vocaux', value: `${voiceChannels}`, inline: true },
        { name: '🎭 Rôles', value: `${roles}`, inline: true },
        { name: '✨ Niveau de boost', value: `Niveau ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
        { name: '🌍 Région', value: guild.preferredLocale || 'Inconnue', inline: true }
      )
      .setFooter({ text: `ID : ${guild.id}` })
      .setTimestamp();

    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 512 }));

    interaction.reply({ embeds: [embed] });
  }
};
