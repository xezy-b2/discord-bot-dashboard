const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const MemberLevel = require('../models/MemberLevel');
const { getUsers } = require('../utils/discordApi');

router.get('/:guildId/leaderboard', requireAuth, requireGuildAccess, async (req, res) => {
  const top = await MemberLevel.find({ guildId: req.params.guildId })
    .sort({ totalXp: -1 })
    .limit(15); // limite volontaire : chaque entree necessite un appel a l'API Discord pour le pseudo

  const usersMap = await getUsers(top.map(m => m.userId));

  const enriched = top.map(m => ({
    ...m.toObject(),
    username: usersMap[m.userId]?.username || null,
    avatar: usersMap[m.userId]?.avatar
      ? `https://cdn.discordapp.com/avatars/${m.userId}/${usersMap[m.userId].avatar}.png?size=64`
      : null
  }));

  res.json(enriched);
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
