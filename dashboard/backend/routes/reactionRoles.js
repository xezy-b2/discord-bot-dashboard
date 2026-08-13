const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildAccess } = require('../middleware/auth');
const GuildConfig = require('../models/GuildConfig');
const { sendMessage, editMessage, addBotReaction, removeAllReactionsForEmoji } = require('../utils/discordApi');
const { buildPanelPayload } = require('../utils/rolePanelBuilder');

async function getOrCreateConfig(guildId) {
  let config = await GuildConfig.findOne({ guildId });
  if (!config) config = await GuildConfig.create({ guildId });
  return config;
}

/** Reconstruit et met à jour le message Discord d'un panneau (boutons/menu) après modification des entrées */
async function syncPanelMessage(entry) {
  if (entry.componentType === 'reaction') return; // rien a editer, les reactions gerent tout seules
  const payload = buildPanelPayload(entry);
  await editMessage(entry.channelId, entry.messageId, payload);
}

// Liste tous les panneaux de rôles du serveur
router.get('/:guildId', requireAuth, requireGuildAccess, async (req, res) => {
  const config = await getOrCreateConfig(req.params.guildId);
  res.json(config.reactionRoles);
});

// Crée un nouveau panneau (toutes les entrées sont fournies d'un coup)
router.post('/:guildId/create', requireAuth, requireGuildAccess, async (req, res) => {
  const { channelId, componentType, mode, title, description, color, entries } = req.body;

  if (!channelId || !title) return res.status(400).json({ error: 'channelId et title requis' });
  if ((componentType === 'button' || componentType === 'select') && (!entries || entries.length === 0)) {
    return res.status(400).json({ error: 'Ajoute au moins une entrée avant de publier un panneau à boutons/menu déroulant' });
  }

  const panelDraft = {
    componentType: componentType || 'reaction',
    mode: mode || 'multi',
    title,
    description: description || '',
    color: color || '#5865F2',
    pairs: entries || []
  };

  try {
    const payload = buildPanelPayload(panelDraft);
    const message = await sendMessage(channelId, payload);

    if (panelDraft.componentType === 'reaction') {
      for (const entry of panelDraft.pairs) {
        await addBotReaction(channelId, message.id, entry.emoji).catch(() => {});
      }
    }

    const config = await getOrCreateConfig(req.params.guildId);
    config.reactionRoles.push({ ...panelDraft, messageId: message.id, channelId });
    await config.save();

    res.json(config.reactionRoles);
  } catch (err) {
    console.error('[REACTION-ROLES] Erreur création :', err.response?.data || err.message);
    res.status(500).json({ error: 'Impossible de créer le message. Vérifie que le bot a accès à ce salon.' });
  }
});

// Ajoute une entrée à un panneau existant
router.post('/:guildId/:messageId/pairs', requireAuth, requireGuildAccess, async (req, res) => {
  const { messageId } = req.params;
  const { emoji, label, roleId, buttonColor } = req.body;
  if (!roleId) return res.status(400).json({ error: 'roleId requis' });

  const config = await getOrCreateConfig(req.params.guildId);
  const entry = config.reactionRoles.find(r => r.messageId === messageId);
  if (!entry) return res.status(404).json({ error: 'Panneau introuvable' });

  if (entry.componentType === 'reaction' && entry.pairs.some(p => p.emoji === emoji)) {
    return res.status(400).json({ error: 'Cet emoji est déjà utilisé sur ce panneau' });
  }
  if (entry.componentType !== 'reaction' && entry.pairs.length >= 25) {
    return res.status(400).json({ error: 'Limite de 25 entrées atteinte pour ce type de composant' });
  }

  try {
    if (entry.componentType === 'reaction') {
      await addBotReaction(entry.channelId, messageId, emoji);
    }

    entry.pairs.push({ emoji, label, roleId, buttonColor: buttonColor || 'gray' });
    config.markModified('reactionRoles');

    if (entry.componentType !== 'reaction') {
      await syncPanelMessage(entry);
    }

    await config.save();
    res.json(entry);
  } catch (err) {
    console.error('[REACTION-ROLES] Erreur ajout :', err.response?.data || err.message);
    res.status(400).json({ error: 'Impossible d\'ajouter cette entrée (emoji invalide ou message inaccessible)' });
  }
});

// Retire une entrée d'un panneau (identifiée par son emoji OU son roleId selon le type)
router.delete('/:guildId/:messageId/pairs/:key', requireAuth, requireGuildAccess, async (req, res) => {
  const { messageId, key } = req.params;
  const decodedKey = decodeURIComponent(key);

  const config = await getOrCreateConfig(req.params.guildId);
  const entry = config.reactionRoles.find(r => r.messageId === messageId);
  if (!entry) return res.status(404).json({ error: 'Panneau introuvable' });

  const removedPair = entry.pairs.find(p => p.emoji === decodedKey || p.roleId === decodedKey);
  entry.pairs = entry.pairs.filter(p => p !== removedPair);
  config.markModified('reactionRoles');
  await config.save();

  try {
    if (entry.componentType === 'reaction' && removedPair) {
      await removeAllReactionsForEmoji(entry.channelId, messageId, removedPair.emoji).catch(() => {});
    } else if (entry.componentType !== 'reaction') {
      await syncPanelMessage(entry);
    }
  } catch (err) {
    console.error('[REACTION-ROLES] Erreur suppression :', err.response?.data || err.message);
  }

  res.json(entry);
});

// Supprime entièrement un panneau (de la config, pas le message Discord)
router.delete('/:guildId/:messageId', requireAuth, requireGuildAccess, async (req, res) => {
  const config = await getOrCreateConfig(req.params.guildId);
  config.reactionRoles = config.reactionRoles.filter(r => r.messageId !== req.params.messageId);
  await config.save();
  res.json(config.reactionRoles);
});

module.exports = router;
