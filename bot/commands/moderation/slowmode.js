const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Active ou désactive le mode lent sur un salon')
    .addIntegerOption(o => o.setName('secondes').setDescription('Délai entre chaque message (0 pour désactiver)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption(o => o.setName('salon').setDescription('Le salon concerné (par défaut : celui-ci)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('secondes');
    const channel = interaction.options.getChannel('salon') || interaction.channel;

    await channel.setRateLimitPerUser(seconds).catch(() => {
      return interaction.reply({ content: '❌ Impossible de modifier ce salon.', ephemeral: true });
    });

    const embed = new EmbedBuilder()
      .setColor(seconds > 0 ? '#FEE75C' : '#57F287')
      .setTitle(seconds > 0 ? '🐌 Mode lent activé' : '⚡ Mode lent désactivé')
      .setDescription(seconds > 0 ? `${channel} : un message toutes les **${seconds}** secondes par membre.` : `${channel} : mode lent désactivé.`)
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
