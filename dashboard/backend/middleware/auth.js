const jwt = require('jsonwebtoken');
const axios = require('axios');

function requireAuth(req, res, next) {
  const token = req.cookies?.session;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session invalide ou expirée' });
  }
}

/**
 * Récupère la liste des serveurs de l'utilisateur directement auprès de Discord
 * (plutôt que depuis le JWT, pour ne pas dépasser la limite de taille des cookies).
 * Mise en cache partagée (30s) par utilisateur pour éviter de déclencher un rate limit
 * Discord quand plusieurs requêtes du dashboard partent en parallèle.
 */
const guildsCache = new Map(); // userId -> { data, expiresAt }
const pendingRequests = new Map(); // userId -> Promise (verrou pour éviter les appels concurrents)
const CACHE_TTL_MS = 30_000;

async function fetchUserGuilds(req) {
  const userId = req.user.id;

  const cached = guildsCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  // Si un appel est déjà en cours pour cet utilisateur, on attend son résultat
  // au lieu de déclencher un second appel Discord en parallèle (cause du rate limit).
  if (pendingRequests.has(userId)) {
    return pendingRequests.get(userId);
  }

  const requestPromise = (async () => {
    try {
      const { data } = await axios.get('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${req.user.accessToken}` }
      });
      guildsCache.set(userId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfterMs = Math.ceil((err.response.data?.retry_after || 1) * 1000) + 200;
        console.warn(`[AUTH] Rate limit Discord détecté, nouvelle tentative dans ${retryAfterMs}ms`);
        await new Promise(r => setTimeout(r, retryAfterMs));
        const { data } = await axios.get('https://discord.com/api/users/@me/guilds', {
          headers: { Authorization: `Bearer ${req.user.accessToken}` }
        });
        guildsCache.set(userId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
        return data;
      }
      throw err;
    } finally {
      pendingRequests.delete(userId);
    }
  })();

  pendingRequests.set(userId, requestPromise);
  return requestPromise;
}

/**
 * Vérifie que l'utilisateur a la permission MANAGE_GUILD (0x20) sur la guilde demandée.
 */
async function requireGuildAccess(req, res, next) {
  const guildId = req.params.guildId;

  try {
    const guilds = await fetchUserGuilds(req);
    const guild = guilds.find(g => g.id === guildId);

    if (!guild) return res.status(403).json({ error: 'Accès refusé à ce serveur' });

    const MANAGE_GUILD = 0x20;
    const isAdmin = guild.owner || (BigInt(guild.permissions) & BigInt(MANAGE_GUILD)) === BigInt(MANAGE_GUILD);
    if (!isAdmin) return res.status(403).json({ error: 'Permissions insuffisantes sur ce serveur' });

    next();
  } catch (err) {
    console.error('[AUTH] Erreur de vérification des droits :', err.response?.data || err.message);
    res.status(401).json({ error: 'Session Discord invalide, reconnecte-toi' });
  }
}

module.exports = { requireAuth, requireGuildAccess, fetchUserGuilds };
