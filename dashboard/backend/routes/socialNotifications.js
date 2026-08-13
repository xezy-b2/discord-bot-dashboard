const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const SocialAccount = require('../models/SocialAccount');

router.get('/:guildId', requireAuth, requireGuildAccess, async (req, res) => {
  const accounts = await SocialAccount.find({ guildId: req.params.guildId }).sort({ createdAt: -1 });
  res.json(accounts);
});

router.post('/:guildId', requireAuth, requireGuildAccess, async (req, res) => {
  const { platform, identifier, displayName, channelId, message, embedColor } = req.body;
  if (!platform || !channelId) {
    return res.status(400).json({ error: 'platform et channelId requis' });
  }

  // Epic Games et Steam sont des suivis globaux (jeux gratuits du store), pas lies a un compte precis
  const isGlobalPlatform = platform === 'epicgames' || platform === 'steam';
  if (!isGlobalPlatform && !identifier) {
    return res.status(400).json({ error: 'identifier requis pour cette plateforme' });
  }

  const doc = await SocialAccount.create({
    guildId: req.params.guildId,
    platform,
    identifier: isGlobalPlatform ? 'global' : identifier,
    displayName: isGlobalPlatform ? '' : (displayName || identifier),
    channelId,
    message: message || '',
    embedColor: embedColor || '',
    lastState: null // premiere verification = pas de notif immediate, juste l'etat initial
  });

  res.json(doc);
});

router.patch('/:guildId/:id', requireAuth, requireGuildAccess, async (req, res) => {
  const { enabled, channelId, message, displayName, embedColor } = req.body;
  const update = {};
  if (enabled !== undefined) update.enabled = enabled;
  if (channelId !== undefined) update.channelId = channelId;
  if (message !== undefined) update.message = message;
  if (displayName !== undefined) update.displayName = displayName;
  if (embedColor !== undefined) update.embedColor = embedColor;

  const doc = await SocialAccount.findOneAndUpdate(
    { _id: req.params.id, guildId: req.params.guildId },
    { $set: update },
    { new: true }
  );
  res.json(doc);
});

router.delete('/:guildId/:id', requireAuth, requireGuildAccess, async (req, res) => {
  await SocialAccount.deleteOne({ _id: req.params.id, guildId: req.params.guildId });
  res.json({ success: true });
});

module.exports = router;
