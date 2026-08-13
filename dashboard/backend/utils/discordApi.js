const axios = require('axios');

const botApi = axios.create({
  baseURL: 'https://discord.com/api/v10',
  headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
});

/** Récupère tous les serveurs où le bot est présent */
async function getBotGuilds() {
  const { data } = await botApi.get('/users/@me/guilds?limit=200');
  return data; // [{id, name, ...}]
}

/** Récupère les salons textuels d'une guilde */
async function getGuildChannels(guildId) {
  const { data } = await botApi.get(`/guilds/${guildId}/channels`);
  return data
    .filter(c => c.type === 0 || c.type === 5) // text + announcement
    .map(c => ({ id: c.id, name: c.name, position: c.position }))
    .sort((a, b) => a.position - b.position);
}

/** Récupère les catégories de salons d'une guilde (pour les tickets) */
async function getGuildCategories(guildId) {
  const { data } = await botApi.get(`/guilds/${guildId}/channels`);
  return data
    .filter(c => c.type === 4) // GuildCategory
    .map(c => ({ id: c.id, name: c.name, position: c.position }))
    .sort((a, b) => a.position - b.position);
}

/** Récupère les rôles d'une guilde */
async function getGuildRoles(guildId) {
  const { data } = await botApi.get(`/guilds/${guildId}/roles`);
  return data
    .filter(r => r.name !== '@everyone' && !r.managed)
    .map(r => ({ id: r.id, name: r.name, color: r.color }))
    .sort((a, b) => b.position - a.position);
}

/** Infos de base d'une guilde (icône, nom, membercount approx.) */
async function getGuildInfo(guildId) {
  const { data } = await botApi.get(`/guilds/${guildId}?with_counts=true`);
  return data;
}

/** Envoie un message dans un salon (utilisé pour créer les messages de reaction roles) */
async function sendMessage(channelId, payload) {
  const { data } = await botApi.post(`/channels/${channelId}/messages`, payload);
  return data;
}

/** Modifie un message existant (utilisé pour ajouter/retirer des boutons ou options de menu) */
async function editMessage(channelId, messageId, payload) {
  const { data } = await botApi.patch(`/channels/${channelId}/messages/${messageId}`, payload);
  return data;
}

/** Convertit un emoji (unicode ou personnalisé <:nom:id> / <a:nom:id>) au format attendu par l'API REST */
function toApiEmojiFormat(emoji) {
  const customMatch = emoji.match(/^<a?:(\w+):(\d+)>$/);
  if (customMatch) return `${customMatch[1]}:${customMatch[2]}`;
  return encodeURIComponent(emoji);
}

/** Fait réagir le bot à un message avec un emoji donné (pour que les membres puissent cliquer dessus) */
async function addBotReaction(channelId, messageId, emoji) {
  const encoded = toApiEmojiFormat(emoji);
  await botApi.put(`/channels/${channelId}/messages/${messageId}/reactions/${encoded}/@me`);
}

/** Retire toutes les réactions d'un emoji donné sur un message (nettoyage lors de la suppression d'une association) */
async function removeAllReactionsForEmoji(channelId, messageId, emoji) {
  const encoded = toApiEmojiFormat(emoji);
  await botApi.delete(`/channels/${channelId}/messages/${messageId}/reactions/${encoded}`);
}

module.exports = {
  botApi,
  getBotGuilds,
  getGuildChannels,
  getGuildCategories,
  getGuildRoles,
  getGuildInfo,
  sendMessage,
  editMessage,
  addBotReaction,
  removeAllReactionsForEmoji,
  toApiEmojiFormat
};
