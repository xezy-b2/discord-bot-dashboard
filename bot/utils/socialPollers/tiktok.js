const axios = require('axios');

/**
 * ATTENTION : TikTok ne propose aucune API publique gratuite pour surveiller les nouvelles
 * publications d'un compte. Cette fonction scrape la page publique du profil et tente d'en
 * extraire l'ID de la derniere video via les donnees JSON embarquees dans le HTML.
 * C'est fragile par nature : TikTok peut changer la structure de sa page a tout moment,
 * bloquer les requetes automatisees, ou renvoyer un contenu different selon la region.
 * Si cette fonction cesse de fonctionner, c'est la cause la plus probable.
 *
 * @param {string} username - pseudo TikTok SANS le @
 * @returns {Promise<{videoId: string, url: string}|null>}
 */
async function checkTiktok(username) {
  const { data: html } = await axios.get(`https://www.tiktok.com/@${username}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 10000
  });

  const match = html.match(/"webapp\.user-detail"[\s\S]*?"itemList":\[(.*?)\]/);
  if (!match) return null;

  const idMatch = match[1].match(/"id":"(\d+)"/);
  if (!idMatch) return null;

  const videoId = idMatch[1];
  return { videoId, url: `https://www.tiktok.com/@${username}/video/${videoId}` };
}

module.exports = { checkTiktok };
