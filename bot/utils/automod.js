// Cache mémoire pour l'anti-spam (pas besoin de DB pour ça, c'est éphémère)
const spamCache = new Map(); // key: guildId-userId -> [timestamps]

const INVITE_REGEX = /(discord\.gg|discordapp\.com\/invite|discord\.com\/invite)\/\S+/i;
const LINK_REGEX = /(https?:\/\/[^\s]+)/i;
// Emoji unicode + emojis personnalises Discord (<:nom:id> ou <a:nom:id>)
const EMOJI_REGEX = /(<a?:\w+:\d+>|\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
const SPOILER_REGEX = /\|\|[\s\S]+?\|\|/;
const HEADER_REGEX = /^#{1,3}\s/m;
const CODEBLOCK_REGEX = /```[\s\S]*?```/;

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

function checkEmojiSpam(content, maxEmojis) {
  const matches = content.match(EMOJI_REGEX);
  return !!matches && matches.length > maxEmojis;
}

function checkForbiddenMentions(message, cfg) {
  const hasProtectedUser = cfg.protectedUserIds?.some(id => message.mentions.users.has(id));
  if (hasProtectedUser) return true;

  const hasProtectedRole = cfg.protectedRoleIds?.some(roleId =>
    message.mentions.roles.has(roleId) ||
    message.mentions.members?.some(m => m.roles.cache.has(roleId))
  );
  return !!hasProtectedRole;
}

function checkMarkdownAbuse(content) {
  return SPOILER_REGEX.test(content) || HEADER_REGEX.test(content) || CODEBLOCK_REGEX.test(content);
}

/**
 * Analyse un message et retourne la raison de violation (ou null si RAS).
 * Chaque fonctionnalite est independamment activable via son propre toggle dans cfg.
 */
function analyzeMessage(message, cfg) {
  if (!cfg.enabled) return null;
  const content = message.content;

  if (cfg.antiInvite && INVITE_REGEX.test(content)) return 'invite_link';
  if (cfg.antiLink && LINK_REGEX.test(content)) return 'external_link';
  if (cfg.antiBannedWords && cfg.bannedWords?.some(w => content.toLowerCase().includes(w.toLowerCase()))) return 'banned_word';
  if (cfg.antiCaps && checkCaps(content, cfg.antiCapsPercent)) return 'excessive_caps';
  if (cfg.antiEmojiSpam && checkEmojiSpam(content, cfg.maxEmojis)) return 'emoji_spam';
  if (cfg.antiMentionSpam && message.mentions.users.size >= cfg.mentionSpamLimit) return 'mention_spam';
  if (cfg.antiPingProtection && checkForbiddenMentions(message, cfg)) return 'forbidden_mention';
  if (cfg.antiMarkdown && checkMarkdownAbuse(content)) return 'markdown_abuse';
  if (cfg.antiSpam && checkSpam(message.guildId, message.author.id, cfg)) return 'spam';

  return null;
}

module.exports = { analyzeMessage };
