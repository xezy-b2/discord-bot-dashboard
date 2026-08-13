const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess, fetchUserGuilds } = require('../middleware/auth');
const { getBotGuilds, getGuildChannels, getGuildCategories, getGuildRoles, getGuildInfo } = require('../utils/discordApi');
const GuildConfig = require('../models/GuildConfig');

const MANAGE_GUILD = 0x20;

// Liste des serveurs geres par l'utilisateur, avec indication si le bot y est present
router.get('/', requireAuth, async (req, res) => {
  try {
    const [userGuilds, botGuilds] = await Promise.all([
      fetchUserGuilds(req),
      getBotGuilds()
    ]);
    const botGuildIds = new Set(botGuilds.map(g => g.id));

    const manageable = userGuilds.filter(g => {
      const isAdmin = g.owner || (BigInt(g.permissions) & BigInt(MANAGE_GUILD)) === BigInt(MANAGE_GUILD);
      return isAdmin;
    });

    const result = manageable.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      botPresent: botGuildIds.has(g.id)
    }));

    res.json(result);
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Erreur lors de la récupération des serveurs' });
  }
});

router.get('/:guildId/info', requireAuth, requireGuildAccess, async (req, res) => {
  try {
    const info = await getGuildInfo(req.params.guildId);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer les infos du serveur' });
  }
});

router.get('/:guildId/channels', requireAuth, requireGuildAccess, async (req, res) => {
  try {
    const channels = await getGuildChannels(req.params.guildId);
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer les salons' });
  }
});

router.get('/:guildId/categories', requireAuth, requireGuildAccess, async (req, res) => {
  try {
    const categories = await getGuildCategories(req.params.guildId);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer les catégories' });
  }
});

router.get('/:guildId/roles', requireAuth, requireGuildAccess, async (req, res) => {
  try {
    const roles = await getGuildRoles(req.params.guildId);
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer les rôles' });
  }
});

module.exports = router;
