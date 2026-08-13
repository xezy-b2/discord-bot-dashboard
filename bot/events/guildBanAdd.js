const { sendLog, buildLogEmbed } = require('../utils/logger');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban) {
    let reason = ban.reason;

    // Le "reason" n'est pas toujours fourni par l'evenement lui-meme selon comment le ban a ete effectue,
    // on tente de recuperer l'audit log pour l'auteur + la raison exacte.
    let executor = null;
    try {
      const auditLogs = await ban.guild.fetchAuditLogs({ type: 22 /* MEMBER_BAN_ADD */, limit: 1 });
      const entry = auditLogs.entries.first();
      if (entry && entry.target.id === ban.user.id) {
        executor = entry.executor;
        reason = reason || entry.reason;
      }
    } catch (e) { /* permissions manquantes pour lire l'audit log, on ignore */ }

    const embed = buildLogEmbed({
      title: '🔨 Membre banni',
      color: '#ED4245',
      fields: [
        { name: 'Membre', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
        { name: 'Par', value: executor ? executor.tag : 'Inconnu', inline: true },
        { name: 'Raison', value: reason || 'Aucune raison fournie' }
      ]
    });

    sendLog(ban.guild, 'memberBan', embed);
  }
};
