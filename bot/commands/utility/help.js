const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Chaque commande liste son permission requise (ou null si accessible à tout le monde).
// Un membre Administrateur voit tout automatiquement (permissions.has() le gere tout seul).
const COMMAND_GROUPS = [
  {
    name: '🛡️ Modération',
    commands: [
      { cmd: '/kick', perm: PermissionFlagsBits.KickMembers },
      { cmd: '/ban', perm: PermissionFlagsBits.BanMembers },
      { cmd: '/unban', perm: PermissionFlagsBits.BanMembers },
      { cmd: '/mute', perm: PermissionFlagsBits.ModerateMembers },
      { cmd: '/unmute', perm: PermissionFlagsBits.ModerateMembers },
      { cmd: '/warn', perm: PermissionFlagsBits.ModerateMembers },
      { cmd: '/warnings', perm: PermissionFlagsBits.ModerateMembers },
      { cmd: '/clear', perm: PermissionFlagsBits.ManageMessages },
      { cmd: '/slowmode', perm: PermissionFlagsBits.ManageChannels },
      { cmd: '/lock', perm: PermissionFlagsBits.ManageChannels },
      { cmd: '/unlock', perm: PermissionFlagsBits.ManageChannels },
      { cmd: '/nickname', perm: PermissionFlagsBits.ManageNicknames }
    ]
  },
  {
    name: '📈 Niveaux',
    commands: [
      { cmd: '/rank', perm: null },
      { cmd: '/leaderboard', perm: null }
    ]
  },
  {
    name: '🎂 Anniversaires',
    commands: [
      { cmd: '/anniversaire definir', perm: null },
      { cmd: '/anniversaire retirer', perm: null },
      { cmd: '/anniversaire liste', perm: null }
    ]
  },
  {
    name: '🔧 Utilitaires',
    commands: [
      { cmd: '/userinfo', perm: null },
      { cmd: '/serverinfo', perm: null },
      { cmd: '/afk', perm: null },
      { cmd: '/remindme', perm: null },
      { cmd: '/embed-modal', perm: PermissionFlagsBits.ManageMessages },
      { cmd: '/ping', perm: null },
      { cmd: '/help', perm: null }
    ]
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche la liste des commandes et le lien du dashboard'),

  async execute(interaction) {
    const memberPerms = interaction.member?.permissions;

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📖 Aide')
      .setDescription('Gère l\'intégralité du bot (bienvenue, modération, niveaux...) depuis le **dashboard web** !\nSeules les commandes que tu as le droit d\'utiliser sont listées ci-dessous.');

    for (const group of COMMAND_GROUPS) {
      const visibleCommands = group.commands.filter(c => !c.perm || memberPerms?.has(c.perm));
      if (visibleCommands.length === 0) continue;

      embed.addFields({
        name: group.name,
        value: visibleCommands.map(c => `\`${c.cmd}\``).join(' ')
      });
    }

    embed.addFields({
      name: '⚙️ Configuration',
      value: 'Tout se configure via le dashboard : bienvenue, départ, rôles automatiques, automod, économie, commandes custom, reaction roles, tickets, messages récurrents, notifications sociales, logs.'
    });

    embed.setFooter({ text: 'Dashboard : ' + (process.env.DASHBOARD_URL || 'http://localhost:5173') });

    interaction.reply({ embeds: [embed] });
  }
};
