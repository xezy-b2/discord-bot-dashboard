const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const GuildConfig = require('../models/GuildConfig');
const Ticket = require('../models/Ticket');
const { sendMessage } = require('../utils/discordApi');

async function getOrCreateConfig(guildId) {
  let config = await GuildConfig.findOne({ guildId });
  if (!config) config = await GuildConfig.create({ guildId });
  return config;
}

// Récupère la config tickets
router.get('/:guildId/config', requireAuth, requireGuildAccess, async (req, res) => {
  const config = await getOrCreateConfig(req.params.guildId);
  res.json(config.tickets);
});

// Met à jour la config tickets (sans créer de panneau)
router.patch('/:guildId/config', requireAuth, requireGuildAccess, async (req, res) => {
  const config = await getOrCreateConfig(req.params.guildId);
  config.tickets = { ...config.tickets.toObject(), ...req.body };
  config.markModified('tickets');
  await config.save();
  res.json(config.tickets);
});

// Crée (ou recrée) le message-panneau avec le bouton "Créer un ticket"
router.post('/:guildId/panel', requireAuth, requireGuildAccess, async (req, res) => {
  const { channelId, title, description, buttonLabel } = req.body;
  if (!channelId) return res.status(400).json({ error: 'channelId requis' });

  try {
    const message = await sendMessage(channelId, {
      embeds: [{
        title: title || '🎫 Support',
        description: description || 'Clique sur le bouton ci-dessous pour ouvrir un ticket.',
        color: 0x5865F2
      }],
      components: [{
        type: 1,
        components: [{ type: 2, style: 1, label: buttonLabel || 'Créer un ticket', emoji: { name: '🎫' }, custom_id: 'ticket_create' }]
      }]
    });

    const config = await getOrCreateConfig(req.params.guildId);
    config.tickets.panelChannelId = channelId;
    config.tickets.panelMessageId = message.id;
    if (buttonLabel) config.tickets.buttonLabel = buttonLabel;
    config.markModified('tickets');
    await config.save();

    res.json(config.tickets);
  } catch (err) {
    console.error('[TICKETS] Erreur création panneau :', err.response?.data || err.message);
    res.status(500).json({ error: 'Impossible de créer le panneau. Vérifie que le bot a accès à ce salon.' });
  }
});

// Liste les tickets (ouverts et fermés recents)
router.get('/:guildId/list', requireAuth, requireGuildAccess, async (req, res) => {
  const tickets = await Ticket.find({ guildId: req.params.guildId }).sort({ createdAt: -1 }).limit(100);
  res.json(tickets);
});

module.exports = router;
