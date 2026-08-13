const axios = require('axios');

/**
 * Utilise le moteur de recherche public du store Steam (la meme requete que la barre de
 * recherche du site, filtree sur "gratuit" + "en promotion") pour lister TOUS les jeux
 * actuellement gratuits suite a une promotion, y compris les offres individuelles d'un
 * editeur qui n'apparaissent pas dans la section "specials" mise en avant par Steam.
 *
 * ATTENTION : Steam ne propose pas d'API officielle structuree pour ce cas precis, donc
 * cette fonction "scrape" un fragment HTML retourne par le moteur de recherche. C'est
 * fonctionnel mais reste best-effort : si Steam change la structure de sa page de
 * resultats, l'extraction peut casser silencieusement (retournera alors une liste vide).
 *
 * @returns {Promise<{freeGames: {title:string, url:string, imageUrl:string, appId:number, originalPrice:number|null, currency:string}[]}>}
 */
async function checkSteamFreeGames() {
  const { data } = await axios.get('https://store.steampowered.com/search/results/', {
    params: {
      query: '',
      start: 0,
      count: 50,
      maxprice: 'free',
      specials: 1,
      infinite: 1
    },
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 10000
  });

  const html = data?.results_html || '';

  // Decoupe le HTML en un bloc par jeu, en utilisant le debut de chaque lien de resultat
  // comme separateur. Beaucoup plus robuste qu'une seule regex geante : chaque info
  // (titre, image, prix) est ensuite cherchee independamment DANS son bloc, peu importe
  // l'ordre exact des balises utilise par Steam.
  const rows = html.split(/<a href="https:\/\/store\.steampowered\.com\/app\//).slice(1);

  const freeGames = [];
  for (const row of rows) {
    const appIdMatch = row.match(/^(\d+)/);
    const titleMatch = row.match(/<span class="title">([^<]+)<\/span>/);
    const imgMatch = row.match(/<img src="([^"]+)"/);
    const originalPriceMatch = row.match(/<div class="discount_original_price">([^<]+)<\/div>/);

    if (!appIdMatch || !titleMatch) continue; // ligne inattendue, on l'ignore plutot que de planter

    const appId = appIdMatch[1];
    const originalPriceRaw = originalPriceMatch?.[1];
    const originalPrice = originalPriceRaw
      ? parseFloat(originalPriceRaw.replace(/[^\d,.]/g, '').replace(',', '.')) || null
      : null;

    freeGames.push({
      title: titleMatch[1].trim(),
      url: `https://store.steampowered.com/app/${appId}`,
      imageUrl: imgMatch?.[1] || null,
      appId: Number(appId),
      originalPrice,
      currency: 'EUR'
    });
  }

  return { freeGames };
}

/**
 * Récupère la description courte d'un jeu via l'API officielle Steam (gratuite, pas de clé requise).
 * Appelée uniquement pour les jeux nouvellement détectés (pas à chaque vérification), pour limiter
 * le nombre de requêtes.
 * @param {number} appId
 * @returns {Promise<string>} - chaîne vide si indisponible
 */
async function fetchSteamDescription(appId) {
  try {
    const { data } = await axios.get('https://store.steampowered.com/api/appdetails', {
      params: { appids: appId, l: 'french', cc: 'fr' },
      timeout: 8000
    });

    const entry = data?.[appId];
    if (!entry?.success) return '';

    const raw = entry.data?.short_description || '';
    // Nettoyage defensif : retire d'eventuelles balises HTML residuelles et les entites courantes
    return raw
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();
  } catch (err) {
    return ''; // pas bloquant : l'embed s'affiche simplement sans description
  }
}

module.exports = { checkSteamFreeGames, fetchSteamDescription };
