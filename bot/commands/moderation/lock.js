const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Verrouille un salon (empêche @everyone d\'écrire)')
    .addChannelOption(o => o.setName('salon').setDescription('Le salon à verrouiller (par défaut : celui-ci)'))
    .addStringOption(o => o.setName('raison').setDescription('Raison du verrouillage'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.options.getChannel('salon') || interaction.channel;
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }, { reason });

    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('🔒 Salon verrouillé')
      .setDescription(`${channel} a été verrouillé.\n**Raison :** ${reason}`)
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
