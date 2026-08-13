const GuildConfig = require('../database/models/GuildConfig');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();
    } catch (e) {
      return;
    }

    const guild = reaction.message.guild;
    if (!guild) return;

    const config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config) return;

    const entry = config.reactionRoles.find(r => r.messageId === reaction.message.id);
    if (!entry || entry.componentType !== 'reaction') return; // ignore les panneaux boutons/menu (geres via interactionCreate)

    const emojiKey = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
    const pair = entry.pairs.find(p => p.emoji === reaction.emoji.name || p.emoji === emojiKey || p.emoji === reaction.emoji.toString());
    if (!pair) return;

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    try {
      if (entry.mode === 'unique') {
        const otherPairs = entry.pairs.filter(p => p.roleId !== pair.roleId && member.roles.cache.has(p.roleId));
        for (const other of otherPairs) {
          await member.roles.remove(other.roleId).catch(() => {});
          const otherReaction = reaction.message.reactions.cache.find(r =>
            r.emoji.name === other.emoji || r.emoji.toString() === other.emoji
          );
          await otherReaction?.users.remove(user.id).catch(() => {});
        }
      }
      await member.roles.add(pair.roleId);
    } catch (err) {
      console.error('[REACTION-ROLES] Erreur attribution :', err);
    }
  }
};
