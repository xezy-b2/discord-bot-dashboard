const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription('Change (ou réinitialise) le pseudo d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Le membre concerné').setRequired(true))
    .addStringOption(o => o.setName('pseudo').setDescription('Nouveau pseudo (laisser vide pour réinitialiser)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

  async execute(interaction) {
    const target = await interaction.guild.members.fetch(interaction.options.getUser('membre').id).catch(() => null);
    const newNick = interaction.options.getString('pseudo') || null;

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!target.manageable) return interaction.reply({ content: '❌ Je ne peux pas modifier ce membre (rôle trop élevé ?).', ephemeral: true });

    await target.setNickname(newNick);

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('✏️ Pseudo modifié')
      .setDescription(newNick ? `${target} s'appelle maintenant **${newNick}**.` : `${target} a retrouvé son pseudo par défaut.`)
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
