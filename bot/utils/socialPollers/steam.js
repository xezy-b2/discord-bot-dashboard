const axios = require('axios');

/**
 * Utilise le moteur de recherche public du store Steam (la meme requete que la barre de
 * recherche du site, filtree sur "gratuit" + "en promotion") pour lister TOUS les jeux
 * actuellement gratuits suite a une promotion, y compris les offres individuelles d'un
 * editeur qui n'apparaissent pas dans la section "specials" mise en avant par Steam
 * (endpoint precedemment utilise, qui ne couvrait que les grosses soldes saisonnieres).
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

  // Chaque resultat est un bloc <a data-ds-appid="..." ...>...<span class="title">Nom</span>...<img src="...">...
  // ...eventuellement <div class="discount_original_price">XX,XX€</div>...</a>
  const rowRegex = /data-ds-appid="(\d+)"[\s\S]*?<span class="title">([^<]+)<\/span>[\s\S]*?<img src="([^"]+)"[\s\S]*?(?:<div class="discount_original_price">([^<]+)<\/div>)?[\s\S]*?<\/a>/g;

  const freeGames = [];
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const [, appId, title, imageUrl, originalPriceRaw] = match;
    const originalPrice = originalPriceRaw
      ? parseFloat(originalPriceRaw.replace(/[^\d,.]/g, '').replace(',', '.')) || null
      : null;

    freeGames.push({
      title: title.trim(),
      url: `https://store.steampowered.com/app/${appId}`,
      imageUrl,
      appId: Number(appId),
      originalPrice,
      currency: 'EUR'
    });
  }

  return { freeGames };
}

module.exports = { checkSteamFreeGames };
