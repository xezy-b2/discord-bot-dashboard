const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const { generateCard, formatVariables } = require('../utils/generateCard');
const { generateRankCard } = require('../utils/generateRankCard');
const { getGuildInfo, sendMessage } = require('../utils/discordApi');

function getAvatarUrl(req) {
  return req.user.avatar
    ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${Number(req.user.id.slice(-1)) % 5}.png`;
}

/**
 * POST /api/preview/:guildId/levelup
 * Preview de la carte affichee lors d'un passage de niveau (meme moteur que bienvenue/depart).
 */
router.post('/:guildId/levelup', requireAuth, requireGuildAccess, async (req, res) => {
  try {
    const cfg = req.body;
    const avatarUrl = getAvatarUrl(req);

    const buffer = await generateRankCard(cfg, {
      username: req.user.username,
      avatarUrl,
      rank: 1,
      level: 7,
      xp: 120,
      requiredXp: 400
    });

    res.json({ image: `data:image/png;base64,${buffer.toString('base64')}` });
  } catch (err) {
    console.error('[PREVIEW][LEVELUP]', err);
    res.status(500).json({ error: 'Erreur lors de la génération du preview' });
  }
});

/**
 * POST /api/preview/:guildId/rank
 * Preview de la carte /rank, avec des valeurs d'exemple pour rang/niveau/XP.
 */
router.post('/:guildId/rank', requireAuth, requireGuildAccess, async (req, res) => {
  try {
    const cfg = req.body;
    const avatarUrl = getAvatarUrl(req);

    const buffer = await generateRankCard(cfg, {
      username: req.user.username,
      avatarUrl,
      rank: 3,
      level: 12,
      xp: 340,
      requiredXp: 500
    });

    res.json({ image: `data:image/png;base64,${buffer.toString('base64')}` });
  } catch (err) {
    console.error('[PREVIEW][RANK]', err);
    res.status(500).json({ error: 'Erreur lors de la génération du preview' });
  }
});

/**
 * POST /api/preview/:guildId/:type   (type = welcome | leave)
 * Body: la config (welcome ou leave) telle qu'éditée en direct dans le dashboard,
 * même non sauvegardée -> rend l'image instantanément avec les VRAIES données
 * de l'utilisateur connecté pour un aperçu fidèle.
 */
router.post('/:guildId/:type', requireAuth, requireGuildAccess, async (req, res) => {
  const { guildId, type } = req.params;
  if (!['welcome', 'leave'].includes(type)) return res.status(400).json({ error: 'Type invalide' });

  try {
    const cfg = req.body; // config live, non sauvegardée
    const guildInfo = await getGuildInfo(guildId).catch(() => null);

    const avatarUrl = getAvatarUrl(req);

    const data = {
      userId: req.user.id,
      username: req.user.username,
      tag: req.user.username,
      serverName: guildInfo?.name || 'Mon Serveur',
      memberCount: guildInfo?.approximate_member_count || 128,
      avatarUrl
    };

    const response = {};
    let cardImageBase64 = null;
    const needsGeneratedCard = cfg.mode === 'image' || cfg.mode === 'both' || (cfg.mode === 'embed' && cfg.embedImageEnabled && cfg.embedImageSource === 'card');

    if (needsGeneratedCard) {
      const buffer = await generateCard(cfg, data);
      cardImageBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
    }

    if (cfg.mode === 'image' || cfg.mode === 'both') {
      response.image = cardImageBase64;
    }

    if (cfg.mode === 'embed' || cfg.mode === 'both') {
      let embedImage = null;
      if (cfg.embedImageEnabled) {
        if (cfg.embedImageSource === 'avatar') embedImage = avatarUrl;
        else if (cfg.embedImageSource === 'custom') embedImage = cfg.embedImageUrl || null;
        else embedImage = cardImageBase64;
      }
      response.embedPreview = {
        description: formatVariables(cfg.message, data),
        color: cfg.embedColor,
        thumbnail: cfg.embedThumbnail ? avatarUrl : null,
        image: embedImage
      };
    }

    response.textPreview = formatVariables(cfg.message, data);

    res.json(response);
  } catch (err) {
    console.error('[PREVIEW]', err);
    res.status(500).json({ error: 'Erreur lors de la génération du preview' });
  }
});

/**
 * POST /api/preview/:guildId/:type/send   (type = welcome | leave)
 * Envoie un VRAI message de test dans le salon configure, avec le pseudo/avatar
 * de l'utilisateur connecte. Prefixe le contenu par un marqueur "🧪 Test" pour
 * qu'il n'y ait aucune ambiguite avec un vrai evenement.
 */
router.post('/:guildId/:type/send', requireAuth, requireGuildAccess, async (req, res) => {
  const { guildId, type } = req.params;
  if (!['welcome', 'leave'].includes(type)) return res.status(400).json({ error: 'Type invalide' });

  const cfg = req.body;
  if (!cfg.channelId) return res.status(400).json({ error: 'Choisis d\'abord un salon d\'envoi avant de tester.' });

  try {
    const guildInfo = await getGuildInfo(guildId).catch(() => null);
    const avatarUrl = getAvatarUrl(req);

    const data = {
      userId: req.user.id,
      username: req.user.username,
      tag: req.user.username,
      serverName: guildInfo?.name || 'Mon Serveur',
      memberCount: guildInfo?.approximate_member_count || 128,
      avatarUrl
    };

    const testPrefix = '🧪 **Test** — ';
    const payload = {};
    let cardBuffer = null;
    let cardAttached = false;

    if (cfg.mode === 'image' || cfg.mode === 'both') {
      cardBuffer = await generateCard(cfg, data);
      cardAttached = true;
    }

    if (cfg.mode === 'embed' || cfg.mode === 'both') {
      const embed = {
        color: cfg.embedColor ? parseInt(cfg.embedColor.replace('#', ''), 16) : 0x5865F2,
        description: testPrefix + formatVariables(cfg.message, data)
      };
      if (cfg.embedThumbnail) embed.thumbnail = { url: avatarUrl };

      if (cfg.embedImageEnabled) {
        if (cfg.embedImageSource === 'avatar') {
          embed.image = { url: avatarUrl };
        } else if (cfg.embedImageSource === 'custom' && cfg.embedImageUrl) {
          embed.image = { url: cfg.embedImageUrl };
        } else {
          if (!cardAttached) { cardBuffer = await generateCard(cfg, data); cardAttached = true; }
          embed.image = { url: 'attachment://card.png' };
        }
      }
      payload.embeds = [embed];
    }

    if (cfg.mode === 'image') {
      payload.content = testPrefix + formatVariables(cfg.message, data);
    }

    const file = cardAttached ? { buffer: cardBuffer, name: 'card.png' } : null;
    await sendMessage(cfg.channelId, payload, file);

    res.json({ success: true });
  } catch (err) {
    console.error('[PREVIEW][SEND]', err.response?.data || err.message);
    res.status(500).json({ error: 'Impossible d\'envoyer le test. Vérifie que le bot a accès à ce salon.' });
  }
});

/**
 * POST /api/preview/:guildId/levelup/send
 * Envoie un VRAI message de test de passage de niveau dans le salon configure.
 */
router.post('/:guildId/levelup/send', requireAuth, requireGuildAccess, async (req, res) => {
  const cfg = req.body.card; // config de la carte (rankCard-shape)
  const message = req.body.message; // texte de legende
  const channelId = req.body.channelId;
  const mode = req.body.mode || 'text';

  if (!channelId) return res.status(400).json({ error: 'Choisis d\'abord un salon d\'annonce avant de tester (ou le salon du message par défaut n\'est pas testable ici).' });

  try {
    const avatarUrl = getAvatarUrl(req);
    const testPrefix = '🧪 **Test** — ';
    const payload = { content: testPrefix + (message || '').replace('{user}', `<@${req.user.id}>`).replace('{level}', '7') };

    let file = null;
    if (mode === 'card') {
      const buffer = await generateRankCard(cfg, {
        username: req.user.username,
        avatarUrl,
        rank: 1,
        level: 7,
        xp: 120,
        requiredXp: 400
      });
      file = { buffer, name: 'levelup.png' };
    }

    await sendMessage(channelId, payload, file);
    res.json({ success: true });
  } catch (err) {
    console.error('[PREVIEW][LEVELUP][SEND]', err.response?.data || err.message);
    res.status(500).json({ error: 'Impossible d\'envoyer le test. Vérifie que le bot a accès à ce salon.' });
  }
});

module.exports = router;
