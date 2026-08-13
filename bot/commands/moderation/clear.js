const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime un nombre de messages dans le salon')
    .addIntegerOption(o => o.setName('nombre').setDescription('Nombre de messages (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('membre').setDescription('Ne supprimer que les messages de ce membre'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('nombre');
    const member = interaction.options.getUser('membre');

    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const filtered = member
      ? messages.filter(m => m.author.id === member.id).first(amount)
      : messages.first(amount);

    const deleted = await interaction.channel.bulkDelete(filtered, true).catch(() => null);

    interaction.editReply(`🧹 ${deleted ? deleted.size : 0} message(s) supprimé(s).`);
  }
};
