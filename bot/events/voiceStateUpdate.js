const { sendLog, buildLogEmbed } = require('../utils/logger');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member) return;

    let embed = null;

    if (!oldState.channel && newState.channel) {
      embed = buildLogEmbed({
        title: '🔊 Membre a rejoint un salon vocal',
        color: '#57F287',
        fields: [
          { name: 'Membre', value: `${member.user.tag}`, inline: true },
          { name: 'Salon', value: `${newState.channel}`, inline: true }
        ]
      });
    } else if (oldState.channel && !newState.channel) {
      embed = buildLogEmbed({
        title: '🔇 Membre a quitté un salon vocal',
        color: '#ED4245',
        fields: [
          { name: 'Membre', value: `${member.user.tag}`, inline: true },
          { name: 'Salon', value: `${oldState.channel}`, inline: true }
        ]
      });
    } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      embed = buildLogEmbed({
        title: '🔀 Membre a changé de salon vocal',
        color: '#5865F2',
        fields: [
          { name: 'Membre', value: `${member.user.tag}`, inline: true },
          { name: 'De', value: `${oldState.channel}`, inline: true },
          { name: 'Vers', value: `${newState.channel}`, inline: true }
        ]
      });
    }

    if (embed) sendLog(member.guild, 'voiceChanges', embed);
  }
};
