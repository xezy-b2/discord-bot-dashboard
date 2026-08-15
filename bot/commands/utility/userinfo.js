const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Correspondance entre les flags publics Discord et un affichage lisible.
// Note : Nitro n'est pas un flag public accessible via l'API bot, donc pas affichable ici.
const BADGE_LABELS = {
  Staff: '🛡️ Employé Discord',
  Partner: '🤝 Partenaire Discord',
  Hypesquad: '🎉 HypeSquad Events',
  BugHunterLevel1: '🐛 Chasseur de bugs',
  BugHunterLevel2: '🐛 Chasseur de bugs (niveau 2)',
  HypeSquadOnlineHouse1: '🦁 HypeSquad Bravoure',
  HypeSquadOnlineHouse2: '💡 HypeSquad Brillance',
  HypeSquadOnlineHouse3: '⚖️ HypeSquad Harmonie',
  PremiumEarlySupporter: '💎 Premier supporter Nitro',
  VerifiedBot: '✅ Bot vérifié',
  VerifiedDeveloper: '👨‍💻 Développeur vérifié tôt',
  CertifiedModerator: '🛠️ Modérateur certifié Discord',
  ActiveDeveloper: '⚡ Développeur actif'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Affiche les informations d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Le membre à consulter')),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('membre') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    // Un fetch force:true est necessaire pour recuperer les flags (badges) a coup sur,
    // le cache local ne les contient pas toujours.
    const user = await interaction.client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser);

    const badgeNames = user.flags?.toArray() || [];
    const badgesText = badgeNames.length
      ? badgeNames.map(name => BADGE_LABELS[name] || `🔸 ${name}`).join('\n')
      : 'Aucun';

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor && member.displayHexColor !== '#000000' ? member.displayHexColor : '#5865F2')
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '📅 Compte créé le', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '🏅 Badges', value: badgesText }
      );

    // Tag de serveur (nouveau systeme "primary guild" de Discord)
    if (user.primaryGuild?.identityEnabled && user.primaryGuild?.tag) {
      embed.addFields({ name: '🏷️ Tag de serveur', value: user.primaryGuild.tag, inline: true });
    }

    // Nameplate (badge decoratif en forme de pilule sous le pseudo)
    if (user.collectibles?.nameplate) {
      const label = user.collectibles.nameplate.label || 'Équipée';
      embed.addFields({ name: '✨ Nameplate', value: label, inline: true });
    }

    // Decoration d'avatar (l'anneau/cadre autour de la photo de profil)
    const decorationUrl = user.avatarDecorationURL?.();
    if (decorationUrl) {
      embed.addFields({ name: '🖼️ Décoration d\'avatar', value: `[Voir](${decorationUrl})`, inline: true });
    }

    if (member) {
      embed.addFields(
        { name: '📥 A rejoint le', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Inconnu', inline: true },
        { name: '🎭 Rôles', value: member.roles.cache.size > 1 ? member.roles.cache.filter(r => r.name !== '@everyone').map(r => `<@&${r.id}>`).join(' ') : 'Aucun' },
        { name: '⏱️ Statut', value: member.communicationDisabledUntil ? `Mute jusqu'à <t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:f>` : 'Actif', inline: true }
      );

      // Le boost de CE serveur est propre au membre (member.premiumSince), pas un flag global du compte
      if (member.premiumSinceTimestamp) {
        embed.addFields({ name: '💜 Booste ce serveur depuis', value: `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:D>`, inline: true });
      }
    }

    embed.setTimestamp();
    interaction.reply({ embeds: [embed] });
  }
};
