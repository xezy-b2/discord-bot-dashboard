// Cache mémoire pour l'anti-spam (pas besoin de DB pour ça, c'est éphémère)
const spamCache = new Map(); // key: guildId-userId -> [timestamps]

const INVITE_REGEX = /(discord\.gg|discordapp\.com\/invite|discord\.com\/invite)\/\S+/i;
const LINK_REGEX = /(https?:\/\/[^\s]+)/i;
const EMOJI_REGEX = /(<a?:\w+:\d+>|\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
const SPOILER_REGEX = /\|\|[\s\S]+?\|\|/;
const HEADER_REGEX = /^#{1,3}\s/m;
const CODEBLOCK_REGEX = /```[\s\S]*?```/;

/** Vrai si le message est exempte pour CETTE fonctionnalite precise (son salon ou l'un des roles du membre) */
function isExempt(message, featureCfg) {
  if (!featureCfg) return false;
  if (featureCfg.ignoredChannels?.includes(message.channel.id)) return true;
  if (message.member?.roles.cache.some(r => featureCfg.ignoredRoles?.includes(r.id))) return true;
  return false;
}

function checkSpam(guildId, userId, spamCfg) {
  const key = `${guildId}-${userId}`;
  const now = Date.now();
  const arr = (spamCache.get(key) || []).filter(t => now - t < spamCfg.intervalMs);
  arr.push(now);
  spamCache.set(key, arr);
  return arr.length > spamCfg.threshold;
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

function checkForbiddenMentions(message, pingCfg) {
  const hasProtectedUser = pingCfg.protectedUserIds?.some(id => message.mentions.users.has(id));
  if (hasProtectedUser) return true;

  const hasProtectedRole = pingCfg.protectedRoleIds?.some(roleId =>
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
 * Chaque fonctionnalite est independamment activable, et possede ses propres
 * exemptions de salons/roles (verifiees via isExempt avant chaque test).
 */
function analyzeMessage(message, cfg) {
  if (!cfg.enabled) return null;
  const content = message.content;

  if (cfg.invite?.enabled && !isExempt(message, cfg.invite) && INVITE_REGEX.test(content)) return 'invite_link';
  if (cfg.link?.enabled && !isExempt(message, cfg.link) && LINK_REGEX.test(content)) return 'external_link';
  if (cfg.bannedWords?.enabled && !isExempt(message, cfg.bannedWords) && cfg.bannedWords.words?.some(w => content.toLowerCase().includes(w.toLowerCase()))) return 'banned_word';
  if (cfg.caps?.enabled && !isExempt(message, cfg.caps) && checkCaps(content, cfg.caps.percent)) return 'excessive_caps';
  if (cfg.emojiSpam?.enabled && !isExempt(message, cfg.emojiSpam) && checkEmojiSpam(content, cfg.emojiSpam.maxEmojis)) return 'emoji_spam';
  if (cfg.mentionSpam?.enabled && !isExempt(message, cfg.mentionSpam) && message.mentions.users.size >= cfg.mentionSpam.limit) return 'mention_spam';
  if (cfg.pingProtection?.enabled && !isExempt(message, cfg.pingProtection) && checkForbiddenMentions(message, cfg.pingProtection)) return 'forbidden_mention';
  if (cfg.markdown?.enabled && !isExempt(message, cfg.markdown) && checkMarkdownAbuse(content)) return 'markdown_abuse';
  if (cfg.spam?.enabled && !isExempt(message, cfg.spam) && checkSpam(message.guildId, message.author.id, cfg.spam)) return 'spam';

  return null;
}

module.exports = { analyzeMessage };
