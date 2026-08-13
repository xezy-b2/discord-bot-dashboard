const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const MemberLevel = require('../models/MemberLevel');

router.get('/:guildId/leaderboard', requireAuth, requireGuildAccess, async (req, res) => {
  const top = await MemberLevel.find({ guildId: req.params.guildId })
    .sort({ totalXp: -1 })
    .limit(100);
  res.json(top);
});

router.patch('/:guildId/member/:userId', requireAuth, requireGuildAccess, async (req, res) => {
  const { level, xp } = req.body;
  const update = {};
  if (level !== undefined) update.level = level;
  if (xp !== undefined) update.xp = xp;

  const record = await MemberLevel.findOneAndUpdate(
    { guildId: req.params.guildId, userId: req.params.userId },
    { $set: update },
    { new: true, upsert: true }
  );
  res.json(record);
});

module.exports = router;
