const axios = require('axios');

/**
 * Utilise l'endpoint (non officiel mais stable et utilisé par la plupart des bots publics)
 * qui liste les promotions en cours sur l'Epic Games Store.
 * L'identifiant configuré par le serveur n'est pas utilisé ici (pas de notion de "compte" a suivre) :
 * une seule verification globale suffit, le champ identifier peut valoir "global".
 * @returns {Promise<{freeGames: {title:string, url:string, imageUrl:string}[]}>}
 */
async function checkEpicGames() {
  const { data } = await axios.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions', {
    params: { locale: 'fr', country: 'FR', allowCountries: 'FR' }
  });

  const elements = data?.data?.Catalog?.searchStore?.elements || [];

  const freeGames = elements
    .filter(el => el.promotions?.promotionalOffers?.length > 0) // actuellement gratuit (pas juste a venir)
    .map(el => ({
      title: el.title,
      url: `https://store.epicgames.com/fr/p/${el.catalogNs?.mappings?.[0]?.pageSlug || el.urlSlug || ''}`,
      imageUrl: el.keyImages?.find(i => i.type === 'OfferImageWide')?.url || el.keyImages?.[0]?.url
    }));

  return { freeGames };
}

module.exports = { checkEpicGames };
