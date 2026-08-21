const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const GuildConfig = require('../models/GuildConfig');
const Birthday = require('../models/Birthday');

const { sendMessage } = require('../utils/discordApi');

async function getOrCreateConfig(guildId) {
  let config = await GuildConfig.findOne({ guildId });
  if (!config) config = await GuildConfig.create({ guildId });
  return config;
}

router.get('/:guildId/config', requireAuth, requireGuildAccess, async (req, res) => {
  const config = await getOrCreateConfig(req.params.guildId);
  res.json(config.birthdays);
});

router.patch('/:guildId/config', requireAuth, requireGuildAccess, async (req, res) => {
  const config = await getOrCreateConfig(req.params.guildId);
  config.birthdays = { ...config.birthdays.toObject(), ...req.body };
  config.markModified('birthdays');
  await config.save();
  res.json(config.birthdays);
});

// Liste en lecture seule (les membres se gèrent eux-mêmes via /anniversaire, mais un admin peut vouloir voir/retirer)
router.get('/:guildId/list', requireAuth, requireGuildAccess, async (req, res) => {
  const birthdays = await Birthday.find({ guildId: req.params.guildId }).sort({ month: 1, day: 1 });
  res.json(birthdays);
});

router.delete('/:guildId/:userId', requireAuth, requireGuildAccess, async (req, res) => {
  await Birthday.deleteOne({ guildId: req.params.guildId, userId: req.params.userId });
  res.json({ success: true });
});

router.post('/:guildId/send-test', requireAuth, requireGuildAccess, async (req, res) => {
  const { channelId, message } = req.body;
  if (!channelId) return res.status(400).json({ error: 'Choisis d\'abord un salon d\'annonce avant de tester.' });

  try {
    const text = '🧪 **Test** — ' + (message || '')
      .replace('{user}', `<@${req.user.id}>`)
      .replace('{age}', '25');

    await sendMessage(channelId, { content: text });
    res.json({ success: true });
  } catch (err) {
    console.error('[BIRTHDAYS][SEND]', err.response?.data || err.message);
    res.status(500).json({ error: 'Impossible d\'envoyer le test. Vérifie que le bot a accès à ce salon.' });
  }
});

module.exports = router;
