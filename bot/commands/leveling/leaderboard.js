const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MemberLevel = require('../../database/models/MemberLevel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Affiche le classement XP du serveur'),

  async execute(interaction) {
    await interaction.deferReply();

    const top = await MemberLevel.find({ guildId: interaction.guild.id })
      .sort({ totalXp: -1 })
      .limit(10);

    if (!top.length) return interaction.editReply('Personne n\'a encore d\'XP sur ce serveur.');

    const medals = ['🥇', '🥈', '🥉'];
    const lines = await Promise.all(top.map(async (rec, i) => {
      const user = await interaction.client.users.fetch(rec.userId).catch(() => null);
      const label = medals[i] || `**${i + 1}.**`;
      return `${label} ${user ? user.tag : 'Utilisateur inconnu'} — Niveau ${rec.level} (${rec.totalXp} XP)`;
    }));

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`🏆 Classement — ${interaction.guild.name}`)
      .setDescription(lines.join('\n'))
      .setTimestamp();

    interaction.editReply({ embeds: [embed] });
  }
};
