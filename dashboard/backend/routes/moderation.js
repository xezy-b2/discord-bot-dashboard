const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const Warning = require('../models/Warning');
const { getGuildBans, unbanUser } = require('../utils/discordApi');

router.get('/:guildId/warnings', requireAuth, requireGuildAccess, async (req, res) => {
  const warnings = await Warning.find({ guildId: req.params.guildId }).sort({ createdAt: -1 }).limit(200);
  res.json(warnings);
});

router.delete('/:guildId/warnings/:warningId', requireAuth, requireGuildAccess, async (req, res) => {
  await Warning.deleteOne({ _id: req.params.warningId, guildId: req.params.guildId });
  res.json({ success: true });
});

router.get('/:guildId/bans', requireAuth, requireGuildAccess, async (req, res) => {
  try {
    const bans = await getGuildBans(req.params.guildId);
    res.json(bans);
  } catch (err) {
    console.error('[MODERATION] Erreur récupération des bans :', err.response?.data || err.message);
    res.status(500).json({ error: 'Impossible de récupérer la liste des bannis.' });
  }
});

router.delete('/:guildId/bans/:userId', requireAuth, requireGuildAccess, async (req, res) => {
  try {
    await unbanUser(req.params.guildId, req.params.userId);
    res.json({ success: true });
  } catch (err) {
    console.error('[MODERATION] Erreur débannissement :', err.response?.data || err.message);
    res.status(500).json({ error: 'Impossible de débannir ce membre.' });
  }
});

module.exports = router;
