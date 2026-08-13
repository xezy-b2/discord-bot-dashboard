const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const Warning = require('../models/Warning');

router.get('/:guildId/warnings', requireAuth, requireGuildAccess, async (req, res) => {
  const warnings = await Warning.find({ guildId: req.params.guildId }).sort({ createdAt: -1 }).limit(200);
  res.json(warnings);
});

router.delete('/:guildId/warnings/:warningId', requireAuth, requireGuildAccess, async (req, res) => {
  await Warning.deleteOne({ _id: req.params.warningId, guildId: req.params.guildId });
  res.json({ success: true });
});

module.exports = router;
