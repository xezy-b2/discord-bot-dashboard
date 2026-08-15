const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Déverrouille un salon précédemment verrouillé')
    .addChannelOption(o => o.setName('salon').setDescription('Le salon à déverrouiller (par défaut : celui-ci)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.options.getChannel('salon') || interaction.channel;

    // Retire l'overwrite explicite plutot que de forcer "true", pour respecter les permissions
    // heritees de la categorie si elles existent.
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });

    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('🔓 Salon déverrouillé')
      .setDescription(`${channel} a été déverrouillé.`)
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
