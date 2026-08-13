const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Retire le mute (timeout) d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Le membre à démute').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('membre');

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!target.communicationDisabledUntil) {
      return interaction.reply({ content: `ℹ️ ${target.user.tag} n'est pas mute actuellement.`, ephemeral: true });
    }
    if (!target.moderatable) return interaction.reply({ content: '❌ Je ne peux pas démute ce membre.', ephemeral: true });

    await target.timeout(null);

    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('🔊 Membre démute')
      .addFields(
        { name: 'Membre', value: `${target.user.tag}`, inline: true },
        { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true }
      )
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
