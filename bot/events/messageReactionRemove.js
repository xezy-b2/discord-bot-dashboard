const GuildConfig = require('../database/models/GuildConfig');

module.exports = {
  name: 'messageReactionRemove',
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
    if (!entry || entry.componentType !== 'reaction') return;

    const emojiKey = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
    const pair = entry.pairs.find(p => p.emoji === reaction.emoji.name || p.emoji === emojiKey || p.emoji === reaction.emoji.toString());
    if (!pair) return;

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    member.roles.remove(pair.roleId).catch(console.error);
  }
};
