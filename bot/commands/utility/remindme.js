const { SlashCommandBuilder } = require('discord.js');
const Reminder = require('../../database/models/Reminder');

const UNIT_TO_MS = {
  minutes: 60_000,
  heures: 3_600_000,
  jours: 86_400_000
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('Programme un rappel personnel')
    .addIntegerOption(o => o.setName('duree').setDescription('Dans combien de temps').setRequired(true).setMinValue(1))
    .addStringOption(o => o.setName('unite').setDescription('Unité de temps').setRequired(true).addChoices(
      { name: 'minutes', value: 'minutes' },
      { name: 'heures', value: 'heures' },
      { name: 'jours', value: 'jours' }
    ))
    .addStringOption(o => o.setName('message').setDescription('Le rappel (optionnel)')),

  async execute(interaction) {
    const duree = interaction.options.getInteger('duree');
    const unite = interaction.options.getString('unite');
    const message = interaction.options.getString('message') || 'Rappel !';

    const remindAt = new Date(Date.now() + duree * UNIT_TO_MS[unite]);

    await Reminder.create({
      userId: interaction.user.id,
      channelId: interaction.channel.id,
      guildId: interaction.guild.id,
      message,
      remindAt
    });

    const ts = Math.floor(remindAt.getTime() / 1000);
    interaction.reply({ content: `⏰ Rappel programmé pour <t:${ts}:F> (<t:${ts}:R>).`, ephemeral: true });
  }
};
