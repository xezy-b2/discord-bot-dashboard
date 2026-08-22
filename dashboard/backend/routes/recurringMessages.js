const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const RecurringMessage = require('../models/RecurringMessage');

router.get('/:guildId', requireAuth, requireGuildAccess, async (req, res) => {
  const messages = await RecurringMessage.find({ guildId: req.params.guildId }).sort({ createdAt: -1 });
  res.json(messages);
});

router.post('/:guildId', requireAuth, requireGuildAccess, async (req, res) => {
  const {
    name, channelId, content, mode,
    intervalMinutes, targetHour, targetMinute,
    sendHourStart, sendHourEnd, daysOfWeek
  } = req.body;

  if (!channelId || !content) {
    return res.status(400).json({ error: 'channelId et content requis' });
  }
  if (mode === 'interval' && (!intervalMinutes || intervalMinutes < 5)) {
    return res.status(400).json({ error: 'Intervalle minimum : 5 minutes' });
  }

  const doc = await RecurringMessage.create({
    guildId: req.params.guildId,
    name: name || '',
    channelId,
    content,
    mode: mode || 'interval',
    intervalMinutes: intervalMinutes || 60,
    targetHour: targetHour ?? 9,
    targetMinute: targetMinute ?? 0,
    sendHourStart: sendHourStart ?? 0,
    sendHourEnd: sendHourEnd ?? 24,
    daysOfWeek: daysOfWeek?.length ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
    nextSendAt: new Date(Date.now() + (intervalMinutes || 60) * 60_000)
  });

  res.json(doc);
});

router.patch('/:guildId/:id', requireAuth, requireGuildAccess, async (req, res) => {
  const {
    enabled, name, content, channelId, mode,
    intervalMinutes, targetHour, targetMinute,
    sendHourStart, sendHourEnd, daysOfWeek
  } = req.body;

  const update = {};
  if (enabled !== undefined) update.enabled = enabled;
  if (name !== undefined) update.name = name;
  if (content !== undefined) update.content = content;
  if (channelId !== undefined) update.channelId = channelId;
  if (mode !== undefined) update.mode = mode;
  if (targetHour !== undefined) update.targetHour = targetHour;
  if (targetMinute !== undefined) update.targetMinute = targetMinute;
  if (sendHourStart !== undefined) update.sendHourStart = sendHourStart;
  if (sendHourEnd !== undefined) update.sendHourEnd = sendHourEnd;
  if (daysOfWeek !== undefined) update.daysOfWeek = daysOfWeek;
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
