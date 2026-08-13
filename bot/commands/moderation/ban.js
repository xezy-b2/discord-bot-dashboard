const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannit un membre du serveur')
    .addUserOption(o => o.setName('membre').setDescription('Le membre à bannir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison du bannissement'))
    .addIntegerOption(o => o.setName('jours_messages').setDescription('Nombre de jours de messages à supprimer (0-7)').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
    const days = interaction.options.getInteger('jours_messages') || 0;

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member && !member.bannable) {
      return interaction.reply({ content: '❌ Je ne peux pas bannir ce membre (rôle trop élevé ?).', ephemeral: true });
    }

    await interaction.guild.members.ban(target.id, { deleteMessageSeconds: days * 86400, reason });

    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('🔨 Membre banni')
      .addFields(
        { name: 'Membre', value: `${target.tag}`, inline: true },
        { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
        { name: 'Raison', value: reason }
      )
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
