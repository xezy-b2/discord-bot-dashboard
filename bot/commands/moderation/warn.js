const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Warning = require('../../database/models/Warning');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertit un membre')
    .addUserOption(o => o.setName('membre').setDescription('Le membre à avertir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison de l\'avertissement').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const reason = interaction.options.getString('raison');

    const warning = await Warning.create({
      guildId: interaction.guild.id,
      userId: target.id,
      moderatorId: interaction.user.id,
      reason
    });

    const count = await Warning.countDocuments({ guildId: interaction.guild.id, userId: target.id });

    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setTitle('⚠️ Avertissement donné')
      .addFields(
        { name: 'Membre', value: `${target.tag}`, inline: true },
        { name: 'Total avertissements', value: `${count}`, inline: true },
        { name: 'Raison', value: reason }
      )
      .setTimestamp();

    interaction.reply({ embeds: [embed] });

    interaction.client.users.send(target.id, `⚠️ Tu as reçu un avertissement sur **${interaction.guild.name}** : ${reason}`).catch(() => {});
  }
};
