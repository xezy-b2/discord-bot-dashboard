const axios = require('axios');

/**
 * Utilise l'endpoint public "featuredcategories" du store Steam (pas de cle necessaire),
 * qui liste notamment les jeux actuellement en promotion. On filtre ceux a -100%
 * (donc gratuits pendant la duree de l'offre) : week-ends gratuits, jeux offerts, etc.
 * Ne remonte pas les jeux free-to-play permanents (ils n'apparaissent pas comme "en promo").
 * Note : cette API ne fournit pas de date de fin de promo (contrairement a Epic Games).
 * @returns {Promise<{freeGames: {title:string, url:string, imageUrl:string, appId:number, originalPrice:number|null, currency:string}[]}>}
 */
async function checkSteamFreeGames() {
  const { data } = await axios.get('https://store.steampowered.com/api/featuredcategories', {
    params: { cc: 'fr', l: 'french' }
  });

  const specials = data?.specials?.items || [];

  const freeGames = specials
    .filter(item => item.discount_percent === 100)
    .map(item => ({
      title: item.name,
      url: `https://store.steampowered.com/app/${item.id}`,
      imageUrl: item.header_image,
      appId: item.id,
      originalPrice: typeof item.original_price === 'number' ? item.original_price / 100 : null,
      currency: 'EUR'
    }));

  return { freeGames };
}

module.exports = { checkSteamFreeGames };
