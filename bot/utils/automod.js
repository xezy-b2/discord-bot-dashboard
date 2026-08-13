// Cache mémoire pour l'anti-spam (pas besoin de DB pour ça, c'est éphémère)
const spamCache = new Map(); // key: guildId-userId -> [timestamps]

const INVITE_REGEX = /(discord\.gg|discordapp\.com\/invite|discord\.com\/invite)\/\S+/i;
const LINK_REGEX = /(https?:\/\/[^\s]+)/i;

function checkSpam(guildId, userId, cfg) {
  const key = `${guildId}-${userId}`;
  const now = Date.now();
  const arr = (spamCache.get(key) || []).filter(t => now - t < cfg.spamIntervalMs);
  arr.push(now);
  spamCache.set(key, arr);
  return arr.length > cfg.spamThreshold;
}

function checkCaps(content, percentLimit) {
  if (!percentLimit || content.length < 8) return false;
  const letters = content.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 8) return false;
  const upper = letters.replace(/[^A-Z]/g, '');
  return (upper.length / letters.length) * 100 >= percentLimit;
}

/**
 * Analyse un message et retourne la raison de violation (ou null si RAS)
 */
function analyzeMessage(message, cfg) {
  if (!cfg.enabled) return null;
  const content = message.content;

  if (cfg.antiInvite && INVITE_REGEX.test(content)) return 'invite_link';
  if (cfg.antiLink && LINK_REGEX.test(content)) return 'external_link';
  if (cfg.bannedWords?.some(w => content.toLowerCase().includes(w.toLowerCase()))) return 'banned_word';
  if (checkCaps(content, cfg.antiCapsPercent)) return 'excessive_caps';
  if (message.mentions.users.size >= (cfg.mentionSpamLimit || 999)) return 'mention_spam';
  if (cfg.antiSpam && checkSpam(message.guildId, message.author.id, cfg)) return 'spam';

  return null;
}

module.exports = { analyzeMessage };
