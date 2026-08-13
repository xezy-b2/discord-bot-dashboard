const { sendLog, buildLogEmbed } = require('../utils/logger');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    if (oldRoles.size === newRoles.size && oldRoles.every(r => newRoles.has(r.id))) return; // aucun changement de role

    const added = newRoles.filter(r => !oldRoles.has(r.id));
    const removed = oldRoles.filter(r => !newRoles.has(r.id));
    if (added.size === 0 && removed.size === 0) return;

    const fields = [
      { name: 'Membre', value: `${newMember.user.tag} (${newMember.id})`, inline: true }
    ];
    if (added.size) fields.push({ name: '➕ Rôles ajoutés', value: added.map(r => `${r}`).join(' ') });
    if (removed.size) fields.push({ name: '➖ Rôles retirés', value: removed.map(r => `${r}`).join(' ') });

    const embed = buildLogEmbed({
      title: '🎭 Rôles modifiés',
      color: '#5865F2',
      fields
    });

    sendLog(newMember.guild, 'roleChanges', embed);
  }
};
