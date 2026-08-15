const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createEmbedCreatorModal } = require('../../utils/embedCreatorHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed-modal')
    .setDescription('Ouvre un formulaire pour créer un embed personnalisé à envoyer dans un salon')
    .addChannelOption(o => o.setName('salon').setDescription('Salon où envoyer l\'embed').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const channel = interaction.options.getChannel('salon');
    const modal = createEmbedCreatorModal(channel.id);
    await interaction.showModal(modal);
  }
};
