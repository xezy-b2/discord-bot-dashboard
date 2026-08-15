const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche la liste des commandes et le lien du dashboard'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📖 Aide')
      .setDescription('Gère l\'intégralité du bot (bienvenue, modération, niveaux...) depuis le **dashboard web** !')
      .addFields(
        { name: '🛡️ Modération', value: '`/kick` `/ban` `/unban` `/mute` `/unmute` `/warn` `/warnings` `/clear` `/slowmode` `/lock` `/unlock` `/nickname`' },
        { name: '📈 Niveaux', value: '`/rank` `/leaderboard`' },
        { name: '🎂 Anniversaires', value: '`/anniversaire definir` `/anniversaire retirer` `/anniversaire liste`' },
        { name: '🔧 Utilitaires', value: '`/userinfo` `/serverinfo` `/afk` `/remindme` `/ping` `/help`' },
        { name: '⚙️ Configuration', value: 'Tout se configure via le dashboard : bienvenue, départ, rôles automatiques, automod, économie, commandes custom, reaction roles, tickets, messages récurrents, notifications sociales, logs.' }
      )
      .setFooter({ text: 'Dashboard : ' + (process.env.DASHBOARD_URL || 'http://localhost:5173') });

    interaction.reply({ embeds: [embed] });
  }
};
