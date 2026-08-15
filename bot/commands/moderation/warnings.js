const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Warning = require('../../database/models/Warning');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Affiche les avertissements d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Le membre à consulter').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const warnings = await Warning.find({ guildId: interaction.guild.id, userId: target.id }).sort({ createdAt: -1 }).limit(15);

    if (!warnings.length) {
      return interaction.reply({ content: `✅ ${target.tag} n'a aucun avertissement.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setTitle(`⚠️ Avertissements de ${target.tag}`)
      .setDescription(
        warnings.map((w, i) =>
          `**${i + 1}.** ${w.reason}\n<t:${Math.floor(w.createdAt.getTime() / 1000)}:D> · par <@${w.moderatorId}>`
        ).join('\n\n')
      )
      .setFooter({ text: `${warnings.length} avertissement(s) au total` })
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
