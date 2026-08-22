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

/** Calcule l'age exact a partir d'une date de naissance (tient compte du mois/jour, pas juste l'annee) */
function calculateAge(birthYear, birthMonth, birthDay) {
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  const hasHadBirthdayThisYear = (now.getMonth() + 1 > birthMonth) || (now.getMonth() + 1 === birthMonth && now.getDate() >= birthDay);
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

/** Construit le texte de mention : @everyone, @here, ou un vrai rôle <@&id> */
function buildMention(mentionRoleId) {
  if (!mentionRoleId) return '';
  if (mentionRoleId === 'everyone') return '@everyone ';
  if (mentionRoleId === 'here') return '@here ';
  return `<@&${mentionRoleId}> `;
}

/**
 * POST /api/birthdays/:guildId/preview
 * Genere un apercu (texte ou embed) avec le pseudo/avatar reel de l'utilisateur connecte
 * et son age reel s'il a enregistre sa date de naissance, sinon un age d'exemple.
 */
router.post('/:guildId/preview', requireAuth, requireGuildAccess, async (req, res) => {
  const cfg = req.body;

  const realBirthday = await Birthday.findOne({ guildId: req.params.guildId, userId: req.user.id });
  const age = realBirthday?.year ? calculateAge(realBirthday.year, realBirthday.month, realBirthday.day) : 25;

  const avatarUrl = req.user.avatar
    ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${Number(req.user.id.slice(-1)) % 5}.png`;

  const text = (cfg.message || '')
    .replace('{user}', `@${req.user.username}`)
    .replace('{age}', String(age));

  const response = { textPreview: text };

  if (cfg.mode === 'embed') {
    response.embedPreview = {
      title: cfg.embedTitle,
      description: text,
      color: cfg.embedColor,
      thumbnail: cfg.embedThumbnail ? avatarUrl : null,
      image: cfg.embedImageUrl || null
    };
  }

  res.json(response);
});

router.post('/:guildId/send-test', requireAuth, requireGuildAccess, async (req, res) => {
  const { channelId, message, mode, embedTitle, embedColor, embedThumbnail, embedImageUrl, mentionRoleId } = req.body;
  if (!channelId) return res.status(400).json({ error: 'Choisis d\'abord un salon d\'annonce avant de tester.' });

  try {
    const realBirthday = await Birthday.findOne({ guildId: req.params.guildId, userId: req.user.id });
    const age = realBirthday?.year ? calculateAge(realBirthday.year, realBirthday.month, realBirthday.day) : null;

    const text = (message || '')
      .replace('{user}', `<@${req.user.id}>`)
      .replace('{age}', age !== null ? String(age) : '25 (exemple — définis ton année de naissance via /anniversaire definir pour un âge réel)');

    const mention = buildMention(mentionRoleId);
    const payload = {};

    if (mode === 'embed') {
      const avatarUrl = req.user.avatar
        ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${Number(req.user.id.slice(-1)) % 5}.png`;

      const embed = {
        title: embedTitle || '🎉 Joyeux anniversaire !',
        description: '🧪 **Test** — ' + text,
        color: embedColor ? parseInt(embedColor.replace('#', ''), 16) : 0xFEE75C
      };
      if (embedThumbnail) embed.thumbnail = { url: avatarUrl };
      if (embedImageUrl) embed.image = { url: embedImageUrl };

      payload.content = mention || undefined;
      payload.embeds = [embed];
    } else {
      payload.content = mention + '🧪 **Test** — ' + text;
    }

    await sendMessage(channelId, payload);
    res.json({ success: true });
  } catch (err) {
    console.error('[BIRTHDAYS][SEND]', err.response?.data || err.message);
    res.status(500).json({ error: 'Impossible d\'envoyer le test. Vérifie que le bot a accès à ce salon.' });
  }
});

module.exports = router;
