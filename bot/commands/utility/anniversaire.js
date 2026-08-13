const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Birthday = require('../../database/models/Birthday');

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function nextOccurrence(day, month) {
  const now = new Date();
  let year = now.getFullYear();
  let date = new Date(year, month - 1, day);
  if (date < now) date = new Date(year + 1, month - 1, day);
  return date;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anniversaire')
    .setDescription('Gère les anniversaires du serveur')
    .addSubcommand(sub => sub
      .setName('definir')
      .setDescription('Enregistre ta date d\'anniversaire')
      .addIntegerOption(o => o.setName('jour').setDescription('Jour (1-31)').setRequired(true).setMinValue(1).setMaxValue(31))
      .addIntegerOption(o => o.setName('mois').setDescription('Mois (1-12)').setRequired(true).setMinValue(1).setMaxValue(12))
      .addIntegerOption(o => o.setName('annee').setDescription('Année de naissance (optionnel, pour afficher l\'âge)'))
    )
    .addSubcommand(sub => sub
      .setName('retirer')
      .setDescription('Supprime ton anniversaire enregistré')
    )
    .addSubcommand(sub => sub
      .setName('liste')
      .setDescription('Affiche les prochains anniversaires du serveur')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'definir') {
      const day = interaction.options.getInteger('jour');
      const month = interaction.options.getInteger('mois');
      const year = interaction.options.getInteger('annee');

      // Validation basique de la date (evite 31 fevrier etc.)
      const testDate = new Date(2024, month - 1, day); // 2024 = annee bissextile pour valider le 29 fevrier
      if (testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
        return interaction.reply({ content: '❌ Cette date n\'existe pas.', ephemeral: true });
      }

      await Birthday.findOneAndUpdate(
        { guildId: interaction.guild.id, userId: interaction.user.id },
        { day, month, year: year || null },
        { upsert: true }
      );

      interaction.reply({ content: `✅ Anniversaire enregistré : **${day} ${MOIS[month - 1]}**${year ? ` ${year}` : ''}.`, ephemeral: true });
    }

    if (sub === 'retirer') {
      const deleted = await Birthday.findOneAndDelete({ guildId: interaction.guild.id, userId: interaction.user.id });
      interaction.reply({ content: deleted ? '✅ Ton anniversaire a été supprimé.' : 'ℹ️ Tu n\'avais pas d\'anniversaire enregistré.', ephemeral: true });
    }

    if (sub === 'liste') {
      const birthdays = await Birthday.find({ guildId: interaction.guild.id });
      if (!birthdays.length) return interaction.reply('Aucun anniversaire enregistré sur ce serveur pour le moment.');

      const sorted = birthdays
        .map(b => ({ ...b.toObject(), next: nextOccurrence(b.day, b.month) }))
        .sort((a, b) => a.next - b.next)
        .slice(0, 15);

      const lines = sorted.map(b => `🎂 <@${b.userId}> — **${b.day} ${MOIS[b.month - 1]}**`);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎂 Prochains anniversaires')
        .setDescription(lines.join('\n'))
        .setTimestamp();

      interaction.reply({ embeds: [embed] });
    }
  }
};
