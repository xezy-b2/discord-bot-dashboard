const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../database/models/GuildConfig');

/**
 * Envoie un embed de log dans le salon configuré, si les logs et ce type d'évènement
 * précis sont activés pour cette guilde.
 * @param {import('discord.js').Guild} guild
 * @param {string} eventKey - une des clés de GuildConfig.logs.events (ex: 'messageDelete')
 * @param {import('discord.js').EmbedBuilder} embed
 */
async function sendLog(guild, eventKey, embed) {
  if (!guild) return;

  const config = await GuildConfig.findOne({ guildId: guild.id });
  if (!config?.logs?.enabled) return;
  if (!config.logs.events?.[eventKey]) return;
  if (!config.logs.channelId) return;

  const channel = guild.channels.cache.get(config.logs.channelId);
  if (!channel) return;

  channel.send({ embeds: [embed] }).catch(() => {});
}

/** Raccourci pour construire un embed de log avec un style cohérent */
function buildLogEmbed({ title, color, description, fields }) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color || '#5865F2')
    .setTimestamp();
  if (description) embed.setDescription(description);
  if (fields?.length) embed.addFields(fields);
  return embed;
}

module.exports = { sendLog, buildLogEmbed };
