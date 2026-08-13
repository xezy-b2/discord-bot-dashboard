const axios = require('axios');

/**
 * @param {string} channelId - ID de la chaîne YouTube (commence par UC...)
 * @returns {Promise<{videoId: string, title: string, thumbnailUrl: string, url: string}|null>}
 */
async function checkYoutube(channelId) {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY manquant dans le .env du bot');
  }

  // On recupere la playlist "uploads" de la chaine, puis sa video la plus recente
  const { data: channelData } = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
    params: { part: 'contentDetails', id: channelId, key: process.env.YOUTUBE_API_KEY }
  });

  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return null;

  const { data: playlistData } = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
    params: { part: 'snippet', playlistId: uploadsPlaylistId, maxResults: 1, key: process.env.YOUTUBE_API_KEY }
  });

  const latest = playlistData.items?.[0];
  if (!latest) return null;

  const videoId = latest.snippet.resourceId.videoId;
  return {
    videoId,
    title: latest.snippet.title,
    thumbnailUrl: latest.snippet.thumbnails?.high?.url,
    url: `https://youtube.com/watch?v=${videoId}`
  };
}

module.exports = { checkYoutube };
