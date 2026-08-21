const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const GuildConfig = require('../models/GuildConfig');

async function getOrCreateConfig(guildId) {
  let config = await GuildConfig.findOne({ guildId });
  if (!config) config = await GuildConfig.create({ guildId });
  return config;
}

// Récupère la config complète du serveur
router.get('/:guildId', requireAuth, requireGuildAccess, async (req, res) => {
  const config = await getOrCreateConfig(req.params.guildId);
  res.json(config);
});

// Met à jour une section précise (welcome / leave / automod / leveling / logs / economy)
// Body attendu : objet partiel à merger dans la section
const ALLOWED_SECTIONS = ['welcome', 'leave', 'automod', 'leveling', 'logs', 'economy', 'autoRoles'];

router.patch('/:guildId/:section', requireAuth, requireGuildAccess, async (req, res) => {
  const { section } = req.params;
  if (!ALLOWED_SECTIONS.includes(section)) {
    return res.status(400).json({ error: 'Section invalide' });
  }

  try {
    const config = await getOrCreateConfig(req.params.guildId);
    config[section] = { ...config[section].toObject(), ...req.body };
    config.markModified(section);
    await config.save();

    res.json(config);
  } catch (err) {
    console.error(`[CONFIG] Erreur sauvegarde section "${section}" :`, err.message);
    res.status(400).json({ error: 'Configuration invalide : ' + err.message });
  }
});

// Champs racine simples (prefix, moderatorRoleIds, muteRoleId)
router.patch('/:guildId', requireAuth, requireGuildAccess, async (req, res) => {
  const config = await getOrCreateConfig(req.params.guildId);
  const { prefix, moderatorRoleIds, muteRoleId } = req.body;

  if (prefix !== undefined) config.prefix = prefix;
  if (moderatorRoleIds !== undefined) config.moderatorRoleIds = moderatorRoleIds;
  if (muteRoleId !== undefined) config.muteRoleId = muteRoleId;

  await config.save();
  res.json(config);
});

// --- Commandes custom ---
router.post('/:guildId/custom-commands', requireAuth, requireGuildAccess, async (req, res) => {
  const config = await getOrCreateConfig(req.params.guildId);
  const { name, response } = req.body;
  if (!name || !response) return res.status(400).json({ error: 'name et response requis' });

  config.customCommands.push({ name: name.toLowerCase(), response, enabled: true });
  await config.save();
  res.json(config.customCommands);
});

router.delete('/:guildId/custom-commands/:name', requireAuth, requireGuildAccess, async (req, res) => {
  const config = await getOrCreateConfig(req.params.guildId);
  config.customCommands = config.customCommands.filter(c => c.name !== req.params.name.toLowerCase());
  await config.save();
  res.json(config.customCommands);
});

module.exports = router;
