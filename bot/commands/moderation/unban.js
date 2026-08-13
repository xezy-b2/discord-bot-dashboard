const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Débannit un membre via son identifiant Discord')
    .addStringOption(o => o.setName('id').setDescription('ID Discord du membre à débannir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison du débannissement'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString('id');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

    const bans = await interaction.guild.bans.fetch();
    const ban = bans.get(userId);

    if (!ban) return interaction.reply({ content: '❌ Cet identifiant ne correspond à aucun membre banni.', ephemeral: true });

    await interaction.guild.bans.remove(userId, reason);

    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('✅ Membre débanni')
      .addFields(
        { name: 'Membre', value: `${ban.user.tag} (${userId})`, inline: true },
        { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
        { name: 'Raison', value: reason }
      )
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
