const axios = require('axios');

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAppAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const { data } = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    }
  });

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * @param {string} username - pseudo Twitch (pas l'URL complète)
 * @returns {Promise<{isLive: boolean, title?: string, gameName?: string, thumbnailUrl?: string, url: string}>}
 */
async function checkTwitch(username) {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    throw new Error('TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET manquants dans le .env du bot');
  }

  const token = await getAppAccessToken();
  const { data } = await axios.get('https://api.twitch.tv/helix/streams', {
    headers: { 'Client-Id': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` },
    params: { user_login: username }
  });

  const stream = data.data[0];
  return {
    isLive: !!stream,
    title: stream?.title,
    gameName: stream?.game_name,
    thumbnailUrl: stream?.thumbnail_url?.replace('{width}', '640').replace('{height}', '360'),
    url: `https://twitch.tv/${username}`
  };
}

module.exports = { checkTwitch };
