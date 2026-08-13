const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Affiche les informations d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Le membre à consulter')),

  async execute(interaction) {
    const user = interaction.options.getUser('membre') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor && member.displayHexColor !== '#000000' ? member.displayHexColor : '#5865F2')
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '📅 Compte créé le', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true }
      );

    if (member) {
      embed.addFields(
        { name: '📥 A rejoint le', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Inconnu', inline: true },
        { name: '🎭 Rôles', value: member.roles.cache.size > 1 ? member.roles.cache.filter(r => r.name !== '@everyone').map(r => `<@&${r.id}>`).join(' ') : 'Aucun' },
        { name: '⏱️ Statut', value: member.communicationDisabledUntil ? `Mute jusqu'à <t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:f>` : 'Actif', inline: true }
      );
    }

    embed.setTimestamp();
    interaction.reply({ embeds: [embed] });
  }
};
