const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Rend muet un membre (timeout Discord)')
    .addUserOption(o => o.setName('membre').setDescription('Le membre à mute').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Durée en minutes').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!target.moderatable) return interaction.reply({ content: '❌ Je ne peux pas mute ce membre.', ephemeral: true });

    await target.timeout(minutes * 60 * 1000, reason);

    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setTitle('🔇 Membre mute')
      .addFields(
        { name: 'Membre', value: `${target.user.tag}`, inline: true },
        { name: 'Durée', value: `${minutes} min`, inline: true },
        { name: 'Raison', value: reason }
      )
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
