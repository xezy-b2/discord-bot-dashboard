const { sendLog, buildLogEmbed } = require('../utils/logger');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild || message.author?.bot) return;

    // Si le message n'est pas en cache (partiel), on n'a pas son contenu : on log quand meme
    // l'evenement mais sans le texte, plutot que de l'ignorer silencieusement.
    const content = message.partial ? '*(contenu indisponible, message non mis en cache)*' : (message.content || '*(pas de texte, probablement une image/fichier)*');

    const embed = buildLogEmbed({
      title: '🗑️ Message supprimé',
      color: '#ED4245',
      fields: [
        { name: 'Auteur', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Inconnu', inline: true },
        { name: 'Salon', value: `${message.channel}`, inline: true },
        { name: 'Contenu', value: content.slice(0, 1000) }
      ]
    });

    sendLog(message.guild, 'messageDelete', embed);
  }
};
