const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const RecurringMessage = require('../models/RecurringMessage');

router.get('/:guildId', requireAuth, requireGuildAccess, async (req, res) => {
  const messages = await RecurringMessage.find({ guildId: req.params.guildId }).sort({ createdAt: -1 });
  res.json(messages);
});

router.post('/:guildId', requireAuth, requireGuildAccess, async (req, res) => {
  const { channelId, content, intervalMinutes } = req.body;
  if (!channelId || !content || !intervalMinutes) {
    return res.status(400).json({ error: 'channelId, content et intervalMinutes requis' });
  }
  if (intervalMinutes < 5) return res.status(400).json({ error: 'Intervalle minimum : 5 minutes' });

  const doc = await RecurringMessage.create({
    guildId: req.params.guildId,
    channelId,
    content,
    intervalMinutes,
    nextSendAt: new Date(Date.now() + intervalMinutes * 60_000)
  });

  res.json(doc);
});

router.patch('/:guildId/:id', requireAuth, requireGuildAccess, async (req, res) => {
  const { enabled, content, intervalMinutes, channelId } = req.body;
  const update = {};
  if (enabled !== undefined) update.enabled = enabled;
  if (content !== undefined) update.content = content;
  if (channelId !== undefined) update.channelId = channelId;
  if (intervalMinutes !== undefined) {
    update.intervalMinutes = intervalMinutes;
    update.nextSendAt = new Date(Date.now() + intervalMinutes * 60_000);
  }

  const doc = await RecurringMessage.findOneAndUpdate(
    { _id: req.params.id, guildId: req.params.guildId },
    { $set: update },
    { new: true }
  );
  res.json(doc);
});

router.delete('/:guildId/:id', requireAuth, requireGuildAccess, async (req, res) => {
  await RecurringMessage.deleteOne({ _id: req.params.id, guildId: req.params.guildId });
  res.json({ success: true });
});

module.exports = router;
