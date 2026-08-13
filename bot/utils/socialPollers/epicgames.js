const axios = require('axios');

/**
 * Utilise l'endpoint (non officiel mais stable et utilisé par la plupart des bots publics)
 * qui liste les promotions en cours sur l'Epic Games Store.
 * Suivi global : une seule verification suffit, l'identifiant configure par le serveur
 * n'est pas utilise (identifier peut valoir "global").
 * @returns {Promise<{freeGames: {title:string, description:string, url:string, imageUrl:string, originalPrice:number|null, currency:string|null, endDate:string|null}[]}>}
 */
async function checkEpicGames() {
  const { data } = await axios.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions', {
    params: { locale: 'fr', country: 'FR', allowCountries: 'FR' }
  });

  const elements = data?.data?.Catalog?.searchStore?.elements || [];

  const freeGames = elements
    .filter(el => el.promotions?.promotionalOffers?.length > 0) // actuellement gratuit (pas juste a venir)
    .map(el => {
      const offer = el.promotions.promotionalOffers[0]?.promotionalOffers?.[0];
      return {
        title: el.title,
        description: el.description || '',
        url: `https://store.epicgames.com/fr/p/${el.catalogNs?.mappings?.[0]?.pageSlug || el.urlSlug || ''}`,
        imageUrl: el.keyImages?.find(i => i.type === 'OfferImageWide')?.url || el.keyImages?.[0]?.url,
        originalPrice: el.price?.totalPrice?.originalPrice ? el.price.totalPrice.originalPrice / 100 : null,
        currency: el.price?.totalPrice?.currencyCode || null,
        endDate: offer?.endDate || null
      };
    });

  return { freeGames };
}

module.exports = { checkEpicGames };
