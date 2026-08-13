const { sendLog, buildLogEmbed } = require('../utils/logger');

module.exports = {
  name: 'guildBanRemove',
  async execute(ban) {
    let executor = null;
    try {
      const auditLogs = await ban.guild.fetchAuditLogs({ type: 23 /* MEMBER_BAN_REMOVE */, limit: 1 });
      const entry = auditLogs.entries.first();
      if (entry && entry.target.id === ban.user.id) executor = entry.executor;
    } catch (e) { /* permissions manquantes, on ignore */ }

    const embed = buildLogEmbed({
      title: '✅ Membre débanni',
      color: '#57F287',
      fields: [
        { name: 'Membre', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
        { name: 'Par', value: executor ? executor.tag : 'Inconnu', inline: true }
      ]
    });

    sendLog(ban.guild, 'memberUnban', embed);
  }
};
