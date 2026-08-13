const { sendLog, buildLogEmbed } = require('../utils/logger');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // evite les faux positifs (embeds qui se chargent, etc.)

    const embed = buildLogEmbed({
      title: '✏️ Message modifié',
      color: '#FEE75C',
      fields: [
        { name: 'Auteur', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
        { name: 'Salon', value: `${newMessage.channel}`, inline: true },
        { name: 'Avant', value: (oldMessage.partial ? '*(indisponible)*' : oldMessage.content || '*(vide)*').slice(0, 500) },
        { name: 'Après', value: (newMessage.content || '*(vide)*').slice(0, 500) },
        { name: 'Lien', value: `[Aller au message](${newMessage.url})` }
      ]
    });

    sendLog(newMessage.guild, 'messageEdit', embed);
  }
};
