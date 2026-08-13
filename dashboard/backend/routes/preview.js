const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const { generateCard, formatVariables } = require('../utils/generateCard');
const { getGuildInfo } = require('../utils/discordApi');

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

    const avatarHash = req.user.avatar;
    const avatarUrl = avatarHash
      ? `https://cdn.discordapp.com/avatars/${req.user.id}/${avatarHash}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${Number(req.user.id.slice(-1)) % 5}.png`;

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

module.exports = router;
